/**
 * Utility functions for robust image handling, normalization, and fallback.
 */

export const FALLBACK_IMAGE = "/images/placeholder.svg";

/**
 * Normalizes an image URL:
 * 1. Converts temporary expiring Supabase signed URLs (`/object/sign/`) into
 *    permanent public URLs (`/object/public/`) and strips the `?token=...` query param.
 *    This ensures images never expire and work for years to come.
 * 2. Cleans up whitespace and handles unencoded spaces.
 * 3. Replaces placeholder template URLs or broken inputs with a reliable local fallback.
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  fallback: string = FALLBACK_IMAGE
): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  let cleanUrl = url.trim();
  if (!cleanUrl) {
    return fallback;
  }

  // Filter out dummy template strings
  if (
    cleanUrl.includes("PASTE_IMAGE_URL_HERE") ||
    cleanUrl.includes("PASTE_IMAGE_UR") ||
    cleanUrl.includes("example.com")
  ) {
    return fallback;
  }

  // Handle Supabase signed URLs to make them permanent and non-expiring
  if (cleanUrl.includes("/storage/v1/object/sign/")) {
    // Replace /object/sign/ with /object/public/
    cleanUrl = cleanUrl.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
    // Remove ?token=... query string completely
    const tokenIndex = cleanUrl.indexOf("?");
    if (tokenIndex !== -1) {
      cleanUrl = cleanUrl.substring(0, tokenIndex);
    }
  }

  // If already a public Supabase URL with leftover token, strip token
  if (cleanUrl.includes("/storage/v1/object/public/") && cleanUrl.includes("?token=")) {
    const tokenIndex = cleanUrl.indexOf("?");
    if (tokenIndex !== -1) {
      cleanUrl = cleanUrl.substring(0, tokenIndex);
    }
  }

  // If it's a relative path
  if (cleanUrl.startsWith("/")) {
    return cleanUrl;
  }

  // If it's a full URL
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    try {
      const parsed = new URL(cleanUrl);
      return parsed.toString();
    } catch {
      return fallback;
    }
  }

  return fallback;
}
