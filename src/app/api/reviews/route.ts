import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const reviews = await prisma.review.findMany({
    where: { productId, moderated: false },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    })),
  });
}

const postSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const purchased = await prisma.orderLine.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId: session.user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    },
  });

  try {
    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: parsed.data.productId,
        },
      },
      create: {
        userId: session.user.id,
        productId: parsed.data.productId,
        rating: parsed.data.rating,
        title: parsed.data.title ?? undefined,
        body: parsed.data.body ?? undefined,
        verifiedPurchase: Boolean(purchased),
      },
      update: {
        rating: parsed.data.rating,
        title: parsed.data.title ?? undefined,
        body: parsed.data.body ?? undefined,
        verifiedPurchase: Boolean(purchased),
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
