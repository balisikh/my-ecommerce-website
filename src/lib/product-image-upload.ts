import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export function validateImageMime(mime: string): string | null {
  return ALLOWED.get(mime) ?? null;
}

export async function storeProductImage(buffer: Buffer, mimeType: string): Promise<string> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("File too large (max 5MB)");
  }
  const ext = validateImageMime(mimeType);
  if (!ext) {
    throw new Error("Invalid image type (use JPEG, PNG, WebP, or GIF)");
  }
  const filename = `${randomUUID()}${ext}`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = Boolean(process.env.VERCEL);
  // Default to private on Vercel to match the common store configuration there.
  // Local dev still defaults to public so it’s easy to inspect uploaded files if desired.
  const blobAccess = (process.env.BLOB_ACCESS ?? (isVercel ? "private" : "public")).toLowerCase();

  // Writing to the local filesystem is fine for local dev, but it is not durable on
  // most production hosts (especially serverless). Fail fast so we never persist
  // broken URLs like `/uploads/...` into the database in production.
  if ((isProduction || isVercel) && !blobToken) {
    throw new Error(
      "Missing BLOB_READ_WRITE_TOKEN. Configure Vercel Blob for product image uploads in production.",
    );
  }

  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const access = blobAccess === "private" ? "private" : "public";
    const blob = await put(`products/${filename}`, buffer, {
      access,
      token: blobToken,
      contentType: mimeType,
    });
    // If the store is private, the returned URL is not publicly fetchable.
    // Return a stable app URL that streams the private blob server-side.
    if (access === "private") {
      return `/api/media/blob?pathname=${encodeURIComponent(blob.pathname)}`;
    }
    return blob.url;
  }

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/products/${filename}`;
}

export function collectImageUrlsFromForm(formData: FormData): string[] {
  const fromList = formData
    .getAll("imageUrls")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const legacy = String(formData.get("imageUrl") ?? "").trim();
  const merged = [...fromList, ...(legacy ? [legacy] : [])];
  return [...new Set(merged)];
}
