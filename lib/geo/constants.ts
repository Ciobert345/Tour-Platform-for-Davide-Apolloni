/** Tile OpenStreetMap ufficiali (100% libere, nessun API key o watermark richiesto) */
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION = "";

export const MAP_CENTER: [number, number] = [45.75, 11.5];
export const MAP_DEFAULT_ZOOM = 8.5;
export const MAP_MIN_ZOOM = 8.0;
export const MAP_MAX_ZOOM = 16;

/** Bounding box focalizzato intorno a Veneto + provincia di Trento con margine per panning comodo */
export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [44.55, 10.15],
  [47.10, 13.35],
];

/** viewbox Nominatim: left, top, right, bottom */
export const NOMINATIM_VIEWBOX = "10.10,47.10,13.40,44.50";

export function geoUserAgent(): string {
  return (
    process.env.GEO_USER_AGENT ||
    "DavideApolloniSito/1.0 (https://davideapolloni.it; contact via site form)"
  );
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
