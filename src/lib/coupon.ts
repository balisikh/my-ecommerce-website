import { CouponType } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function computeCouponDiscount(
  subtotal: number,
  code: string | undefined,
  userId: string,
): Promise<{ discount: number; couponId: string | null; couponCode: string | null }> {
  if (!code?.trim()) {
    return { discount: 0, couponId: null, couponCode: null };
  }
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });
  if (!coupon) {
    return { discount: 0, couponId: null, couponCode: null };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { discount: 0, couponId: null, couponCode: null };
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { discount: 0, couponId: null, couponCode: null };
  }
  if (coupon.maxRedemptions != null) {
    const count = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    });
    if (count >= coupon.maxRedemptions) {
      return { discount: 0, couponId: null, couponCode: null };
    }
  }
  const already = await prisma.couponRedemption.findFirst({
    where: { couponId: coupon.id, userId },
  });
  if (already) {
    return { discount: 0, couponId: null, couponCode: null };
  }

  let discount = 0;
  if (coupon.type === CouponType.PERCENT) {
    discount = Math.floor((subtotal * coupon.value) / 100);
  } else {
    discount = Math.min(coupon.value, subtotal);
  }
  return { discount, couponId: coupon.id, couponCode: coupon.code };
}
