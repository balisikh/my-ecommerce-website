"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { publicImageUrl } from "@/lib/public-image-url";

type Props = {
  /** Existing image URLs (edit screen) — shown as read-only previews, not re-submitted */
  existingUrls?: string[];
};

export default function ProductImageUploadField({ existingUrls = [] }: Props) {
  const [pending, setPending] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setPending(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/upload/product-image", {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error ?? `Failed to upload ${file.name}`);
          continue;
        }
        if (data.url) next.push(data.url);
      }
      if (next.length) {
        setUploaded((prev) => [...prev, ...next]);
        toast.success(next.length === 1 ? "Image uploaded" : `${next.length} images uploaded`);
      }
    } finally {
      setPending(false);
    }
  }, []);

  function removeUploaded(url: string) {
    setUploaded((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      {existingUrls.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current images</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {existingUrls.map((url) => (
              <li
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
              >
                <Image
                  src={publicImageUrl(url)}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="80px"
                />
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-zinc-500">New uploads are added below existing images.</p>
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium">Upload images</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={pending}
          onChange={(e) => {
            void uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-orange-300"
        />
        <p className="mt-1 text-xs text-zinc-500">
          JPEG, PNG, WebP, or GIF · max 5MB each. Set{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">BLOB_READ_WRITE_TOKEN</code> on
          Vercel for persistent storage.
        </p>
      </div>

      {uploaded.map((url) => (
        <div key={url} className="flex items-center gap-3">
          <input type="hidden" name="imageUrls" value={url} />
          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <Image
              src={publicImageUrl(url)}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="64px"
            />
          </div>
          <span className="max-w-[200px] truncate text-xs text-zinc-500">{url}</span>
          <button
            type="button"
            onClick={() => removeUploaded(url)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      {pending ? <p className="text-sm text-zinc-500">Uploading…</p> : null}
    </div>
  );
}
