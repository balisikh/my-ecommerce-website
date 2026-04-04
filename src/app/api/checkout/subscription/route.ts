import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  productId: z.string().min(1),
  locale: z.string().min(2).max(5).optional().default("en"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product?.isSubscriptionEligible || !product.stripePriceId) {
    return NextResponse.json(
      { error: "Product is not available for subscription checkout" },
      { status: 400 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const loc = parsed.data.locale;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email ?? undefined,
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/${loc}/subscriptions?sub=success`,
    cancel_url: `${baseUrl}/${loc}/products/${product.slug}`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    metadata: {
      userId: session.user.id,
      productId: product.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
