import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const CART_COOKIE = "cart_session";

export async function getCartForViewer() {
  const session = await auth();
  if (session?.user?.id) {
    return prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" } },
                seller: true,
              },
            },
          },
        },
      },
    });
  }
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_COOKIE)?.value;
  if (!sessionId) return null;
  return prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: "asc" } },
              seller: true,
            },
          },
        },
      },
    },
  });
}

export function newSessionCartId() {
  return randomUUID();
}

export { CART_COOKIE };

export function cartSellerIds(
  items: { product: { sellerId: string } }[],
): Set<string> {
  return new Set(items.map((i) => i.product.sellerId));
}
