import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { computeCouponDiscount } from "@/lib/coupon";

const querySchema = z.object({
  code: z.string().min(1).max(64),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ code: searchParams.get("code") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart?.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const { discount, couponId, couponCode } = await computeCouponDiscount(
    subtotal,
    parsed.data.code,
    session.user.id,
  );

  if (!couponId || !couponCode || discount <= 0) {
    return NextResponse.json(
      { ok: false, error: "Coupon not valid for this cart." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    couponId,
    couponCode,
    subtotal,
    discount,
    totalAfterDiscount: Math.max(0, subtotal - discount),
  });
}

