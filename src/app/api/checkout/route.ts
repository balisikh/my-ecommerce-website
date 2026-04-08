import { NextResponse } from "next/server";
import { z } from "zod";
import { CouponType } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { computeCouponDiscount } from "@/lib/coupon";

const bodySchema = z.object({
  locale: z.string().min(2).max(5).optional().default("en"),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(2),
    label: z.string().optional(),
  }),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { seller: true } } } },
    },
  });
  if (!cart?.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const sellerIds = [...new Set(cart.items.map((i) => i.product.sellerId))];
  const singleSeller = sellerIds.length === 1;
  const seller = singleSeller ? cart.items[0].product.seller : null;

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock: ${item.product.title}` },
        { status: 400 },
      );
    }
  }

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      line1: parsed.data.address.line1,
      line2: parsed.data.address.line2,
      city: parsed.data.address.city,
      state: parsed.data.address.state,
      postalCode: parsed.data.address.postalCode,
      country: parsed.data.address.country,
      label: parsed.data.address.label,
    },
  });

  const subtotal = cart.items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );
  const { discount, couponId, couponCode } = await computeCouponDiscount(
    subtotal,
    parsed.data.couponCode,
    session.user.id,
  );

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Payments are not configured (STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const loc = parsed.data.locale;

  const lineItems = cart.items.map(
    (item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.product.price,
        product_data: {
          name: item.product.title,
          metadata: { productId: item.product.id },
        },
      },
    }),
  );

  let discounts: { coupon: string }[] | undefined;
  if (discount > 0 && couponId) {
    const dbCoupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (dbCoupon) {
      if (dbCoupon.type === CouponType.PERCENT) {
        const c = await stripe.coupons.create({
          percent_off: dbCoupon.value,
          duration: "once",
          name: `cart-${cart.id}`,
        });
        discounts = [{ coupon: c.id }];
      } else {
        const c = await stripe.coupons.create({
          amount_off: discount,
          currency: "usd",
          duration: "once",
          name: `cart-${cart.id}`,
        });
        discounts = [{ coupon: c.id }];
      }
    }
  }

  const shipping = 500;
  const enableTax = process.env.STRIPE_ENABLE_TAX === "true";
  const taxBps = parseInt(process.env.TAX_BPS ?? "0", 10);
  const afterDisc = subtotal - discount;
  const tax =
    !enableTax && taxBps > 0
      ? Math.round(((afterDisc + shipping) * taxBps) / 10000)
      : 0;

  const connectFee =
    seller?.stripeConnectAccountId && seller.commissionBps > 0
      ? Math.max(Math.round(afterDisc * (seller.commissionBps / 10000)), 1)
      : 0;

  const lineItemsFinal =
    tax > 0 && !enableTax
      ? [
          ...lineItems,
          {
            quantity: 1,
            price_data: {
              currency: "usd" as const,
              unit_amount: tax,
              product_data: { name: "Estimated tax", metadata: { productId: "tax" } },
            },
          },
        ]
      : lineItems;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: lineItemsFinal,
    success_url: `${baseUrl}/${loc}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${loc}/cart`,
    metadata: {
      cartId: cart.id,
      userId: session.user.id,
      addressId: address.id,
      couponCode: couponCode ?? "",
      couponId: couponId ?? "",
      discount: String(discount),
      subtotal: String(subtotal),
      shipping: String(shipping),
      tax: String(tax),
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping, currency: "usd" },
          display_name: "Standard shipping",
        },
      },
    ],
    ...(discounts ? { discounts } : {}),
    ...(enableTax
      ? {
          automatic_tax: { enabled: true },
          billing_address_collection: "required" as const,
        }
      : {}),
    ...(singleSeller && seller?.stripeConnectAccountId && connectFee > 0
      ? {
          payment_intent_data: {
            application_fee_amount: connectFee,
            transfer_data: { destination: seller.stripeConnectAccountId },
          },
        }
      : {}),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
