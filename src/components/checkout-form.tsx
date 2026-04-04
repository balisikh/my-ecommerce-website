"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CheckoutForm() {
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    label: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          couponCode: couponCode || undefined,
          address: {
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state || undefined,
            postalCode: form.postalCode,
            country: form.country,
            label: form.label || undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed. Is Stripe configured?");
        return;
      }
      toast.success("Redirecting to secure checkout…");
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold">Shipping address</h2>
      <Input
        required
        placeholder="Address line 1"
        value={form.line1}
        onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
      />
      <Input
        placeholder="Address line 2"
        value={form.line2}
        onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          required
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
        <Input
          placeholder="State / region"
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          required
          placeholder="Postal code"
          value={form.postalCode}
          onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
        />
        <Input
          required
          placeholder="Country (ISO, e.g. US)"
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
          maxLength={2}
        />
      </div>
      <Input
        placeholder="Label (optional)"
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
      />
      <h2 className="pt-4 text-lg font-semibold">Coupon</h2>
      <Input
        placeholder="Code (e.g. SAVE10)"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Redirecting to Stripe…" : "Pay with Stripe"}
      </Button>
      <p className="text-xs text-zinc-500">
        Standard shipping ($5.00) is added in Stripe Checkout. Set STRIPE_ENABLE_TAX=true and configure
        Stripe Tax for automatic tax.
      </p>
    </form>
  );
}
