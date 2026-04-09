import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { publicImageUrl } from "@/lib/public-image-url";
import { formatMoney } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import AddToCartButton from "@/components/add-to-cart-button";
import WishlistButton from "@/components/wishlist-button";
import SubscribeButton from "@/components/subscribe-button";
import ReviewsSection from "@/components/reviews-section";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true, images: { take: 1 } },
  });
  if (!product) return { title: "Product" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: product.images[0]
      ? { images: [publicImageUrl(product.images[0].url)] }
      : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, locale } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      seller: true,
      category: true,
    },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {product.images[0] ? (
              <Image
                src={publicImageUrl(product.images[0].url)}
                alt={product.images[0].alt ?? product.title}
                fill
                unoptimized
                className="object-cover"
                priority
                sizes="(max-width:768px) 100vw, 50vw"
              />
            ) : null}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.slice(1).map((im) => (
                <div key={im.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={publicImageUrl(im.url)}
                    alt={im.alt ?? ""}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <Link
            href={`/search?category=${encodeURIComponent(product.category.slug)}`}
            className="text-sm text-orange-600 hover:underline"
          >
            {product.category.name}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {product.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sold by{" "}
            <Link
              href={`/search?seller=${encodeURIComponent(product.seller.slug)}`}
              className="text-orange-600 hover:underline"
            >
              {product.seller.shopName}
            </Link>
          </p>
          <p className="mt-4 text-3xl font-semibold text-orange-600">
            {formatMoney(product.price)}
            {product.compareAtPrice ? (
              <span className="ml-2 text-lg font-normal text-zinc-400 line-through">
                {formatMoney(product.compareAtPrice)}
              </span>
            ) : null}
          </p>
          <p className="mt-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {product.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
            <WishlistButton productId={product.id} />
            {product.isSubscriptionEligible ? (
              <SubscribeButton productId={product.id} locale={locale} />
            ) : null}
          </div>
          {product.stock <= 0 ? (
            <p className="mt-4 text-sm text-red-600">Out of stock</p>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">{product.stock} in stock</p>
          )}
        </div>
      </div>
      <ReviewsSection productId={product.id} />
    </div>
  );
}
