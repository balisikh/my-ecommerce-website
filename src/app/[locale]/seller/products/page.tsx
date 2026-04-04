import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { sellerDeleteProduct } from "../actions";
import DeleteProductForm from "@/components/delete-product-form";
import SellerNewProductForm from "@/components/forms/seller-new-product-form";

export default async function SellerProductsPage({
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

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">My products</h1>
      <div className="mt-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-semibold">Add product</h2>
        <SellerNewProductForm categories={categories} />
      </div>
      <ul className="mt-10 space-y-2">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 py-2 dark:border-zinc-900"
          >
            <Link href={`/products/${p.slug}`} className="text-orange-600 hover:underline">
              {p.title}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">
                {formatMoney(p.price)} · {p.stock} in stock
              </span>
              <DeleteProductForm
                action={sellerDeleteProduct}
                productId={p.id}
                afterDeletePath="/seller/products"
                buttonClassName="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Delete
              </DeleteProductForm>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
