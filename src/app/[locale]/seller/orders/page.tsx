import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default async function SellerOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller) {
    return <p className="text-zinc-500">No seller profile.</p>;
  }

  const lines = await prisma.orderLine.findMany({
    where: { sellerId: seller.id },
    orderBy: { id: "desc" },
    take: 100,
    include: {
      order: {
        include: { user: { select: { email: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Order lines</h1>
      <p className="mt-2 text-sm text-zinc-500">Recent lines containing your SKUs</p>
      <ul className="mt-8 space-y-4">
        {lines.map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
          >
            <p className="font-mono text-xs text-zinc-500">Order {l.orderId}</p>
            <p className="mt-1">{l.title} × {l.quantity}</p>
            <p className="text-zinc-500">{l.order.user.email}</p>
            <p className="mt-1 font-medium">{formatMoney(l.unitPrice * l.quantity)}</p>
            <p className="text-xs text-zinc-400">{l.order.status}</p>
          </li>
        ))}
        {lines.length === 0 ? <p className="text-zinc-500">No sales yet.</p> : null}
      </ul>
    </div>
  );
}
