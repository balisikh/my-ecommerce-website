import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 flex flex-wrap gap-4 border-b border-zinc-200 pb-4 text-sm font-medium dark:border-zinc-800">
        <Link href="/admin" className="text-orange-600">
          Dashboard
        </Link>
        <Link href="/admin/products" className="hover:text-orange-600">
          Products
        </Link>
        <Link href="/admin/orders" className="hover:text-orange-600">
          Orders
        </Link>
        <Link href="/admin/analytics" className="hover:text-orange-600">
          Analytics
        </Link>
      </nav>
      {children}
    </div>
  );
}
