import Image from "next/image";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    images: { url: string; alt: string | null }[];
    seller: { shopName: string };
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const img = product.images[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt ?? product.title}
            fill
            unoptimized
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 25vw"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{product.seller.shopName}</p>
        <h3 className="font-medium text-zinc-900 line-clamp-2 dark:text-zinc-100">
          {product.title}
        </h3>
        <p className="mt-auto text-lg font-semibold text-orange-600">
          {formatMoney(product.price)}
        </p>
      </div>
    </Link>
  );
}
