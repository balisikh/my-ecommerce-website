import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { CART_COOKIE, newSessionCartId } from "@/lib/cart";

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).optional().default(1),
});

const patchSchema = z.object({
  lineId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product || product.stock < parsed.data.quantity) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
  }

  const session = await auth();
  let cartId: string;
  let guestSid: string | null = null;

  if (session?.user?.id) {
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });
    cartId = cart.id;
  } else {
    const cookieStore = await cookies();
    guestSid = cookieStore.get(CART_COOKIE)?.value ?? newSessionCartId();
    const cart = await prisma.cart.upsert({
      where: { sessionId: guestSid },
      create: { sessionId: guestSid },
      update: {},
    });
    cartId = cart.id;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });
  if (!cart) {
    return NextResponse.json({ error: "Cart error" }, { status: 500 });
  }
  const sellers = new Set(cart.items.map((i) => i.product.sellerId));
  if (sellers.size > 0 && !sellers.has(product.sellerId)) {
    return NextResponse.json(
      { error: "Cart can only contain items from one seller. Clear cart first." },
      { status: 400 },
    );
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId, productId: product.id },
    },
    create: {
      cartId,
      productId: product.id,
      quantity: parsed.data.quantity,
    },
    update: {
      quantity: { increment: parsed.data.quantity },
    },
  });

  const res = NextResponse.json({ ok: true });
  if (guestSid) {
    res.cookies.set(CART_COOKIE, guestSid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return res;
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const line = await prisma.cartItem.findUnique({
    where: { id: parsed.data.lineId },
    include: { cart: true },
  });
  if (!line) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = await assertCartAccess(line.cart);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parsed.data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: line.id } });
  } else {
    const p = await prisma.product.findUnique({ where: { id: line.productId } });
    if (!p || p.stock < parsed.data.quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }
    await prisma.cartItem.update({
      where: { id: line.id },
      data: { quantity: parsed.data.quantity },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return NextResponse.json({ ok: true });
  }
  const sid = (await cookies()).get(CART_COOKIE)?.value;
  if (sid) {
    const cart = await prisma.cart.findUnique({ where: { sessionId: sid } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
  return NextResponse.json({ ok: true });
}

async function assertCartAccess(cart: { userId: string | null; sessionId: string | null }) {
  const session = await auth();
  if (session?.user?.id) {
    return cart.userId === session.user.id;
  }
  const sid = (await cookies()).get(CART_COOKIE)?.value;
  return Boolean(sid && cart.sessionId === sid);
}
