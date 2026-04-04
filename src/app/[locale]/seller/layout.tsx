import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";

export default async function SellerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "SELLER" && session.user.role !== "ADMIN")
  ) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/seller`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 flex flex-wrap gap-4 border-b border-zinc-200 pb-4 text-sm font-medium dark:border-zinc-800">
        <Link href="/seller" className="text-orange-600">
          Dashboard
        </Link>
        <Link href="/seller/onboarding" className="hover:text-orange-600">
          Stripe Connect
        </Link>
        <Link href="/seller/products" className="hover:text-orange-600">
          My products
        </Link>
        <Link href="/seller/orders" className="hover:text-orange-600">
          My orders
        </Link>
      </nav>
      {children}
    </div>
  );
}
