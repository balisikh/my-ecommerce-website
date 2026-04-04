"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import type { MutationResult } from "@/lib/action-result";

type Props = {
  action: (formData: FormData) => Promise<MutationResult>;
  productId: string;
  buttonClassName?: string;
  children?: ReactNode;
  /** Where to navigate after successful delete */
  afterDeletePath: "/admin/products" | "/seller/products";
};

export default function DeleteProductForm({
  action,
  productId,
  buttonClassName = "rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40",
  children = "Delete",
  afterDeletePath,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !window.confirm(
        "Delete this product permanently? This cannot be undone. Products that appear on past orders cannot be deleted.",
      )
    ) {
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("productId", productId);
    const result = await action(fd);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product deleted");
    router.push(afterDeletePath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <button type="submit" disabled={pending} className={buttonClassName}>
        {pending ? "Deleting…" : children}
      </button>
    </form>
  );
}
