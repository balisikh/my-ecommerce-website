"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null };
};

export default function ReviewsSection({ productId }: { productId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Could not submit review");
        return;
      }
      toast.success("Review saved");
      setTitle("");
      setBody("");
      await load();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="text-xl font-semibold">Reviews</h2>
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{r.user.name ?? r.user.email}</span>
              <span className="text-sm text-amber-600">{"★".repeat(r.rating)}</span>
            </div>
            {r.title ? <p className="mt-1 font-medium">{r.title}</p> : null}
            {r.body ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{r.body}</p> : null}
          </li>
        ))}
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet. Be the first.</p>
        ) : null}
      </ul>
      {status === "authenticated" ? (
        <form onSubmit={submit} className="mt-8 max-w-md space-y-3">
          <label className="block text-sm font-medium">
            Rating
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Title (optional)
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </label>
          <label className="block text-sm font-medium">
            Review (optional)
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 min-h-[100px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <Button type="submit" disabled={loading}>
            Submit review
          </Button>
        </form>
      ) : null}
    </section>
  );
}
