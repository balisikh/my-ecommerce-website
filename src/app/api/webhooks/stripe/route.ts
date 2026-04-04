import { headers } from "next/headers";
import type Stripe from "stripe";
import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new Response("Webhook misconfigured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return new Response("ok", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await prisma.stripeEvent.create({
            data: { id: event.id, type: event.type },
          });
          break;
        }
        await fulfillCheckoutSession(session, event.id, event.type);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as StripeSubscriptionPayload;
        await syncSubscription(sub);
        await prisma.stripeEvent.create({
          data: { id: event.id, type: event.type },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as StripeSubscriptionPayload;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "canceled" },
        });
        const row = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (row) {
          await prisma.subscriptionEntitlement.deleteMany({
            where: { userId: row.userId, key: "subscription_active" },
          });
        }
        await prisma.stripeEvent.create({
          data: { id: event.id, type: event.type },
        });
        break;
      }
      default:
        await prisma.stripeEvent.create({
          data: { id: event.id, type: event.type },
        });
    }
  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
  eventType: string,
) {
  if (session.payment_status !== "paid") {
    await prisma.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
    return;
  }

  const meta = session.metadata ?? {};
  const cartId = meta.cartId;
  const userId = meta.userId;
  const addressId = meta.addressId;
  if (!cartId || !userId || !addressId) {
    await prisma.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
    return;
  }

  const dup = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (dup) {
    await prisma.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
    return;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });
  if (!cart?.items.length) {
    await prisma.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
    return;
  }

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new Error(`Out of stock for ${item.product.title}`);
    }
  }

  const subtotal = parseInt(meta.subtotal ?? "0", 10);
  const discount = parseInt(meta.discount ?? "0", 10);
  const shipping = parseInt(meta.shipping ?? "0", 10);
  const tax = parseInt(meta.tax ?? "0", 10);
  const total = session.amount_total ?? subtotal - discount + shipping + tax;
  const sellerId = meta.sellerId || cart.items[0].product.sellerId;
  const couponId = meta.couponId || "";
  const couponCode = meta.couponCode || null;

  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PAID,
        stripeSessionId: session.id,
        stripePaymentIntentId: pi ?? null,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        addressId,
        sellerId,
        couponCode,
        lines: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            sellerId: i.product.sellerId,
            title: i.product.title,
            unitPrice: i.product.price,
            quantity: i.quantity,
          })),
        },
      },
    });

    if (couponId) {
      await tx.couponRedemption.create({
        data: {
          couponId,
          userId,
          orderId: order.id,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.stripeEvent.create({
      data: { id: eventId, type: eventType },
    });
  });
}

type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_end?: number;
};

async function syncSubscription(sub: StripeSubscriptionPayload) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const end = sub.current_period_end;
  const periodEnd = end ? new Date(end * 1000) : null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
    },
  });

  if (sub.status === "active" || sub.status === "trialing") {
    await prisma.subscriptionEntitlement.upsert({
      where: {
        userId_key: { userId, key: "subscription_active" },
      },
      create: { userId, key: "subscription_active" },
      update: {},
    });
  } else {
    await prisma.subscriptionEntitlement.deleteMany({
      where: { userId, key: "subscription_active" },
    });
  }
}
