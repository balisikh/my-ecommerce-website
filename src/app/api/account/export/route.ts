import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [user, orders, addresses, reviews, wishlist] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { userId },
      include: { lines: true },
    }),
    prisma.address.findMany({ where: { userId } }),
    prisma.review.findMany({ where: { userId } }),
    prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { select: { title: true, slug: true } } },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    orders,
    addresses,
    reviews,
    wishlist,
  };

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="export-${userId}.json"`,
    },
  });
}
