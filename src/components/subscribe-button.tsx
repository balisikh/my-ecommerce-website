"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SubscribeButton({
  productId,
  locale,
}: {
  productId: string;
  locale: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (status !== "authenticated") {
      toast.info("Please log in to subscribe");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Subscription checkout unavailable");
        return;
      }
      toast.success("Opening subscription checkout…");
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" disabled={loading} onClick={start}>
      {loading ? "Redirecting…" : "Subscribe"}
    </Button>
  );
}
