import { Link } from "@/i18n/routing";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        Manage catalog, orders, and view revenue aggregates.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/products"
          className="rounded-xl border border-zinc-200 p-6 hover:border-orange-500 dark:border-zinc-800"
        >
          <h2 className="font-semibold">Products</h2>
          <p className="mt-1 text-sm text-zinc-500">CRUD and image URL</p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-zinc-200 p-6 hover:border-orange-500 dark:border-zinc-800"
        >
          <h2 className="font-semibold">Orders</h2>
          <p className="mt-1 text-sm text-zinc-500">Status updates</p>
        </Link>
        <Link
          href="/admin/analytics"
          className="rounded-xl border border-zinc-200 p-6 hover:border-orange-500 dark:border-zinc-800"
        >
          <h2 className="font-semibold">Analytics</h2>
          <p className="mt-1 text-sm text-zinc-500">Revenue by day</p>
        </Link>
        <Link
          href="/admin/coupons"
          className="rounded-xl border border-zinc-200 p-6 hover:border-orange-500 dark:border-zinc-800"
        >
          <h2 className="font-semibold">Coupons</h2>
          <p className="mt-1 text-sm text-zinc-500">Create and manage promo codes</p>
        </Link>
      </ul>
    </div>
  );
}
