import prisma from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/utils";
import { adminDeleteProduct } from "../actions";
import DeleteProductForm from "@/components/delete-product-form";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { seller: true, category: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          New product
        </Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">Title</th>
            <th className="py-2">Seller</th>
            <th className="py-2">Category</th>
            <th className="py-2">Price</th>
            <th className="py-2">Stock</th>
            <th className="w-28 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2">
                <Link href={`/admin/products/${p.id}`} className="text-orange-600 hover:underline">
                  {p.title}
                </Link>
              </td>
              <td className="py-2">{p.seller.shopName}</td>
              <td className="py-2">{p.category.name}</td>
              <td className="py-2">{formatMoney(p.price)}</td>
              <td className="py-2">{p.stock}</td>
              <td className="py-2 text-right">
                <DeleteProductForm
                  action={adminDeleteProduct}
                  productId={p.id}
                  afterDeletePath="/admin/products"
                  buttonClassName="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Delete
                </DeleteProductForm>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
