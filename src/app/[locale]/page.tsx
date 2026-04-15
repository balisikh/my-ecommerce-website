import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import prisma from "@/lib/prisma";
import ProductCard from "@/components/product-card";

/** Cache this page in production so repeat visits are fast (dev is still slower on purpose). */
export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations("home");
  const products = await prisma.product.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      seller: true,
    },
  });

  return (
    <div>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-orange-50 to-zinc-50 py-16 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            {t("hero")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            {t("subtitle")}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
          >
            {t("ctaShop")}
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Featured products
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
