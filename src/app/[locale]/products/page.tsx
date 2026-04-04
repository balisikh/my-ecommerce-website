import prisma from "@/lib/prisma";
import ProductCard from "@/components/product-card";
import { Link } from "@/i18n/routing";

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      orderBy: { title: "asc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        seller: true,
        category: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">All products</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/search?category=${encodeURIComponent(c.slug)}`}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:border-orange-500 dark:border-zinc-600"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
