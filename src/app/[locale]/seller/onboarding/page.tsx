"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SellerOnboardingPage() {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start onboarding (Stripe configured?)");
        return;
      }
      toast.success("Redirecting to Stripe…");
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Stripe Connect onboarding</h1>
      <p className="mt-4 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
        Connect your payout account to receive funds for orders where the platform collects an
        application fee. Use Stripe test mode until you are ready for production.
      </p>
      <Button type="button" className="mt-6" disabled={loading} onClick={start}>
        {loading ? "Redirecting…" : "Start / refresh onboarding"}
      </Button>
    </div>
  );
}
