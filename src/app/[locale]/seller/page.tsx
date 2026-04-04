import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";

export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { products: true } },
    },
  });
  if (!seller) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Seller</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          No seller profile is linked to this account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{seller.shopName}</h1>
      <p className="mt-2 text-sm text-zinc-500">Slug: {seller.slug}</p>
      <p className="mt-2 text-sm">
        Verification: <strong>{seller.verificationStatus}</strong>
        {seller.stripeConnectAccountId ? (
          <span className="ml-2 text-green-600">· Stripe Connect linked</span>
        ) : (
          <span className="ml-2 text-amber-600">· Connect onboarding required</span>
        )}
      </p>
      <p className="mt-4">Products: {seller._count.products}</p>
      <p className="mt-2 text-sm text-zinc-500">
        Commission (basis points): {seller.commissionBps} (
        {(seller.commissionBps / 100).toFixed(2)}%)
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/seller/onboarding"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:border-orange-500 dark:border-zinc-700"
        >
          Stripe Connect
        </Link>
        <Link
          href="/seller/products"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
        >
          Manage products
        </Link>
      </div>
    </div>
  );
}
