"use client";

import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ClearCartButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function clear() {
    setLoading(true);
    await fetch("/api/cart", { method: "DELETE" });
    toast.success("Cart cleared");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button type="button" variant="ghost" disabled={loading} onClick={clear}>
      Clear cart
    </Button>
  );
}
