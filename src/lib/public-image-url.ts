export function publicImageUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return u;

  // Already proxied.
  if (u.startsWith("/api/media/blob?pathname=")) return u;

  // If a private blob URL was stored directly, rewrite it to our proxy route.
  // Example private URL: https://<store>.private.blob.vercel-storage.com/products/<id>.png
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      const host = parsed.hostname.toLowerCase();
      if (host.endsWith(".private.blob.vercel-storage.com")) {
        const pathname = parsed.pathname.replace(/^\//, "");
        return `/api/media/blob?pathname=${encodeURIComponent(pathname)}`;
      }
    } catch {
      // fall through
    }
  }

  return u;
}

