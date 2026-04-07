"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { adminCreateProduct } from "@/app/[locale]/admin/actions";
import ProductImageUploadField from "@/components/product-image-upload-field";

type Category = { id: string; name: string };
type Seller = { id: string; shopName: string };

export default function AdminNewProductForm({
  categories,
  sellers,
}: {
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
    const result = await adminCreateProduct(fd);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product created");
    setUploadKey((k) => k + 1);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Slug (optional)</label>
        <input
          name="slug"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          required
          rows={4}
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Stock</label>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">SKU (optional)</label>
        <input
          name="sku"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <select
          name="categoryId"
          required
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shopName}
            </option>
          ))}
        </select>
      </div>
      <ProductImageUploadField key={uploadKey} />
      <div>
        <label className="text-sm font-medium">Image URL (optional)</label>
        <input
          name="imageUrl"
          type="url"
          placeholder="Or paste an external image URL…"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isSubscriptionEligible" />
        Subscription eligible (set Stripe price id below)
      </label>
      <div>
        <label className="text-sm font-medium">Stripe price id (recurring)</label>
        <input
          name="stripePriceId"
          placeholder="price_…"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
