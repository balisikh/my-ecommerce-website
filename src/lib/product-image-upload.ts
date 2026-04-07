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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`products/${filename}`, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType,
    });
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
