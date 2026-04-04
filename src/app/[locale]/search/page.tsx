import prisma from "@/lib/prisma";
import ProductCard from "@/components/product-card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; seller?: string }>;
}) {
  const { q, category, seller } = await searchParams;
  const products = await prisma.product.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { category: { slug: category } } : {},
        seller ? { seller: { slug: seller } } : {},
      ],
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      seller: true,
    },
    orderBy: { title: "asc" },
    take: 48,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">Search results</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {q ? `Query: “${q}”` : "Browse filters"}
        {category ? ` · Category: ${category}` : ""}
        {seller ? ` · Seller: ${seller}` : ""}
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 ? (
        <p className="mt-8 text-zinc-500">No products match.</p>
      ) : null}
    </div>
  );
}
