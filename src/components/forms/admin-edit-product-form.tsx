"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { adminUpdateProduct, adminDeleteProduct } from "@/app/[locale]/admin/actions";
import DeleteProductForm from "@/components/delete-product-form";
import ProductImageUploadField from "@/components/product-image-upload-field";
type Category = { id: string; name: string };
type Seller = { id: string; shopName: string };

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  sellerId: string;
  isSubscriptionEligible: boolean;
  stripePriceId: string | null;
  images: { url: string }[];
};

export default function AdminEditProductForm({
  product,
  categories,
  sellers,
}: {
  product: Product;
  categories: Category[];
  sellers: Seller[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await adminUpdateProduct(product.id, fd);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product updated");
    setUploadKey((k) => k + 1);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input
            name="title"
            required
            defaultValue={product.title}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input
            name="slug"
            required
            defaultValue={product.slug}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={product.description}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Price (USD)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={(product.price / 100).toFixed(2)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={product.stock}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            name="categoryId"
            required
            defaultValue={product.categoryId}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Seller</label>
          <select
            name="sellerId"
            required
            defaultValue={product.sellerId}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shopName}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isSubscriptionEligible"
            defaultChecked={product.isSubscriptionEligible}
          />
          Subscription eligible
        </label>
        <div>
          <label className="text-sm font-medium">Stripe price id</label>
          <input
            name="stripePriceId"
            defaultValue={product.stripePriceId ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <ProductImageUploadField
          key={uploadKey}
          existingUrls={product.images.map((i) => i.url)}
        />
        <div>
          <label className="text-sm font-medium">Add image from URL (optional)</label>
          <input
            name="imageUrl"
            type="url"
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <div className="mt-10 max-w-lg border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Delete this product. Blocked if it was ever included on an order.
        </p>
        <div className="mt-4">
          <DeleteProductForm
            action={adminDeleteProduct}
            productId={product.id}
            afterDeletePath="/admin/products"
          />
        </div>
      </div>
    </>
  );
}
