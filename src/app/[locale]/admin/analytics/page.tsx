import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [paidOrders, revenueAgg, countAgg] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: since },
      },
      select: { id: true, total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: since },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: since },
      },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (const o of paidOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics (30 days)</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Paid orders</p>
          <p className="text-3xl font-bold">{countAgg}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Revenue</p>
          <p className="text-3xl font-bold">
            {formatMoney(revenueAgg._sum.total ?? 0)}
          </p>
        </div>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Revenue by day</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {[...byDay.entries()].map(([day, cents]) => (
          <li key={day} className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-900">
            <span>{day}</span>
            <span>{formatMoney(cents)}</span>
          </li>
        ))}
        {byDay.size === 0 ? <li className="text-zinc-500">No data</li> : null}
      </ul>
    </div>
  );
}
