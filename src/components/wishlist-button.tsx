"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function WishlistButton({ productId }: { productId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [onList, setOnList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`);
      const data = await res.json().catch(() => ({}));
      if (!cancelled && data.onList) setOnList(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, productId]);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (onList) {
        await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        });
        setOnList(false);
        toast.success("Removed from wishlist");
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) {
          toast.error("Could not update wishlist");
          return;
        }
        setOnList(true);
        toast.success("Saved to wishlist");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" disabled={loading} onClick={toggle}>
      {onList ? "Saved" : "Wishlist"}
    </Button>
  );
}
