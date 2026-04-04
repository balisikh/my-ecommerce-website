import prisma from "@/lib/prisma";
import AdminNewProductForm from "@/components/forms/admin-new-product-form";

export default async function NewProductPage() {
  const [categories, sellers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.seller.findMany({ orderBy: { shopName: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">New product</h1>
      <AdminNewProductForm categories={categories} sellers={sellers} />
    </div>
  );
}
