const DEV_FALLBACK_URL = "http://localhost:3000";

function normalize(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Public base URL for links that leave the app (emails, metadata, sitemaps).
 *
 * Set `SITE_URL` to change every generated link — it is read at runtime, so a
 * value change only needs a server restart, not a rebuild. `NEXT_PUBLIC_SITE_URL`
 * is still honoured for backwards compatibility, but it is inlined at build time,
 * so a stale build can keep serving an old value.
 */
export function getSiteUrl() {
  const configured =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) return normalize(configured);
  if (process.env.VERCEL_URL) return normalize(process.env.VERCEL_URL);

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[site] SITE_URL is not configured — outgoing links will point at localhost.",
    );
  }

  return DEV_FALLBACK_URL;
}

/** Absolute URL for an in-app path, e.g. absoluteUrl("/verify-email?token=x"). */
export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
