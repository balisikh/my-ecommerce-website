"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminUpdateOrderStatus } from "@/app/[locale]/admin/actions";

const statuses: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(current);
  }, [current]);

  async function save() {
    setLoading(true);
    const result = await adminUpdateOrderStatus(orderId, status);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Order status updated");
    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={loading || status === current}
        className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700"
      >
        Update
      </button>
    </div>
  );
}
