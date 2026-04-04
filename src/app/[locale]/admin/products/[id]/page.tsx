import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminEditProductForm from "@/components/forms/admin-edit-product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, sellers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.seller.findMany({ orderBy: { shopName: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit product</h1>
      <AdminEditProductForm product={product} categories={categories} sellers={sellers} />
    </div>
  );
}
