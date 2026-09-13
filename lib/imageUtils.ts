/**
 * Utility per l'ottimizzazione e il caricamento ultra-rapido delle immagini esterne.
 */

/**
 * Placeholder SVG ultraleggero in formato Base64 (warm palette del sito)
 * Viene mostrato istantaneamente da Next.js prima che l'immagine sia scaricata,
 * evitando il flash del box vuoto o il caricamento a scatti.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFMkQ2QzQiLz48L3N2Zz4=";

/**
 * Ottimizza un URL immagine esterno (es. Unsplash o CDN):
 * - Ridimensiona alla larghezza massima desiderata (es. 720px per card invece di 1920px raw da 2MB)
 * - Imposta formato automatico (WebP/AVIF) e qualità ottimale (75-80%)
 * - Riduce il peso del download fino all'85%
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  maxWidth = 720,
  quality = 75
): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Se è un'immagine Unsplash, regola i parametri di query per non scaricare immagini 4K inutilmente
  if (trimmed.includes("images.unsplash.com")) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("q", String(quality));

      const currentW = parseInt(u.searchParams.get("w") || "0", 10);
      if (!currentW || currentW > maxWidth) {
        u.searchParams.set("w", String(maxWidth));
      }
      return u.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
