"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { sellerCreateProduct } from "@/app/[locale]/seller/actions";
import ProductImageUploadField from "@/components/product-image-upload-field";

type Category = { id: string; name: string };

export default function SellerNewProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await sellerCreateProduct(fd);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product created");
    e.currentTarget.reset();
    setUploadKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 max-w-lg space-y-3">
      <input
        name="title"
        required
        placeholder="Title"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        name="slug"
        placeholder="Slug (optional)"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        name="description"
        required
        rows={3}
        placeholder="Description"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Price USD"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="stock"
          type="number"
          min="0"
          defaultValue={0}
          placeholder="Stock"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <select
        name="categoryId"
        required
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ProductImageUploadField key={uploadKey} />
      <input
        name="imageUrl"
        type="url"
        placeholder="Or image URL (optional)"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
