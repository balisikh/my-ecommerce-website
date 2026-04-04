import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProductCard from "@/components/product-card";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/wishlist`);
  }
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          seller: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <ProductCard key={i.id} product={i.product} />
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-8 text-zinc-500">Save products from the product page.</p>
      ) : null}
    </div>
  );
}
