import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/account/orders`);
  }
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { lines: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Your orders</h1>
      <ul className="mt-8 space-y-6">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm text-zinc-500">{o.id}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                {o.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {new Date(o.createdAt).toLocaleString()}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {o.lines.map((l) => (
                <li key={l.id}>
                  {l.title} × {l.quantity} — {formatMoney(l.unitPrice * l.quantity)}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-semibold">Total {formatMoney(o.total)}</p>
          </li>
        ))}
        {orders.length === 0 ? (
          <p className="text-zinc-500">
            No orders yet.{" "}
            <Link href="/products" className="text-orange-600 hover:underline">
              Shop
            </Link>
          </p>
        ) : null}
      </ul>
    </div>
  );
}
