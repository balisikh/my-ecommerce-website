import prisma from "@/lib/prisma";
import { CouponType } from "@prisma/client";
import { adminCreateCoupon } from "../actions";
import { formatMoney } from "@/lib/utils";

async function createCouponAction(formData: FormData): Promise<void> {
  "use server";
  await adminCreateCoupon(formData);
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ expiresAt: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Coupons</h1>
      </div>

      <form action={createCouponAction} className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Code</label>
          <input
            name="code"
            required
            placeholder="SAVE15"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Codes are stored uppercase. Customers type this at checkout.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            name="type"
            defaultValue={CouponType.PERCENT}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value={CouponType.PERCENT}>Percent off</option>
            <option value={CouponType.FIXED}>Fixed amount off</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Value</label>
          <input
            name="value"
            type="number"
            min={1}
            step={1}
            required
            placeholder="10"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">Percent: 10 = 10% off. Fixed: 500 = $5.00 off.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Min subtotal (optional)</label>
          <input
            name="minSubtotal"
            type="number"
            min={0}
            step="0.01"
            placeholder="50.00"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Max redemptions (optional)</label>
          <input
            name="maxRedemptions"
            type="number"
            min={1}
            step={1}
            placeholder="100"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Expires at (optional)</label>
          <input
            name="expiresAt"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="sm:col-span-2">
          <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
            Create coupon
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Existing coupons</h2>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">Code</th>
            <th className="py-2">Type</th>
            <th className="py-2">Value</th>
            <th className="py-2">Min subtotal</th>
            <th className="py-2">Expires</th>
            <th className="py-2">Max</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 font-mono">{c.code}</td>
              <td className="py-2">{c.type === CouponType.PERCENT ? "PERCENT" : "FIXED"}</td>
              <td className="py-2">
                {c.type === CouponType.PERCENT ? `${c.value}%` : formatMoney(c.value)}
              </td>
              <td className="py-2">{c.minSubtotal != null ? formatMoney(c.minSubtotal) : "—"}</td>
              <td className="py-2">{c.expiresAt ? c.expiresAt.toLocaleString() : "—"}</td>
              <td className="py-2">{c.maxRedemptions ?? "—"}</td>
            </tr>
          ))}
          {coupons.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-zinc-500">
                No coupons yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

