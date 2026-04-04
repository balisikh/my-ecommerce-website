import { Link } from "@/i18n/routing";
import prisma from "@/lib/prisma";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id
    ? await prisma.order.findUnique({
        where: { stripeSessionId: session_id },
        select: { id: true, total: true, status: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Thank you!</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-300">
        {order
          ? `Order ${order.id.slice(0, 8)}… is ${order.status.toLowerCase()}.`
          : "Your payment is processing. You will receive a confirmation shortly."}
      </p>
      <Link href="/account/orders" className="mt-8 inline-block text-orange-600 hover:underline">
        View orders
      </Link>
    </div>
  );
}
