import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import OrderStatusForm from "@/components/order-status-form";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } }, lines: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <ul className="mt-8 space-y-6">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-zinc-500">{o.id}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{o.user.email}</p>
                <p className="text-sm">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMoney(o.total)}</p>
                <OrderStatusForm orderId={o.id} current={o.status} />
              </div>
            </div>
            <ul className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              {o.lines.map((l) => (
                <li key={l.id}>
                  {l.title} × {l.quantity}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
