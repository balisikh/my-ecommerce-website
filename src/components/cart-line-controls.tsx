"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function CartLineControls({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(next: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, quantity: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update cart");
        return;
      }
      if (next === 0) {
        toast.success("Removed from cart");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="h-8 w-8 p-0"
        disabled={loading || quantity <= 1}
        onClick={() => update(quantity - 1)}
      >
        −
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        type="button"
        variant="secondary"
        className="h-8 w-8 p-0"
        disabled={loading}
        onClick={() => update(quantity + 1)}
      >
        +
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="text-red-600"
        disabled={loading}
        onClick={() => update(0)}
      >
        Remove
      </Button>
    </div>
  );
}
