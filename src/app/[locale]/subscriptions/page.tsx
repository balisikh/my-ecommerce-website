import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function SubscriptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/subscriptions`);
  }
  const subs = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const entitlements = await prisma.subscriptionEntitlement.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      {sp.sub === "success" ? (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          Subscription checkout completed. Status updates via Stripe webhooks.
        </p>
      ) : null}
      <h2 className="mt-8 text-lg font-semibold">Active entitlements</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300">
        {entitlements.map((e) => (
          <li key={e.id}>{e.key}</li>
        ))}
        {entitlements.length === 0 ? <li>None</li> : null}
      </ul>
      <h2 className="mt-8 text-lg font-semibold">Stripe subscriptions</h2>
      <ul className="mt-4 space-y-3">
        {subs.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
          >
            <span className="font-mono text-xs">{s.stripeSubscriptionId}</span>
            <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
              {s.status}
            </span>
            {s.currentPeriodEnd ? (
              <p className="mt-1 text-zinc-500">
                Current period ends {s.currentPeriodEnd.toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
        {subs.length === 0 ? (
          <p className="text-zinc-500">Subscribe from an eligible product page.</p>
        ) : null}
      </ul>
    </div>
  );
}
