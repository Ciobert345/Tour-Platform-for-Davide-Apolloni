import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { MAP_BOUNDS } from "./constants";

export function isPointInBBox(lat: number, lng: number): boolean {
  const [[minLat, minLng], [maxLat, maxLng]] = MAP_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

export function isPointInOperatingArea(
  lat: number,
  lng: number,
  fc: FeatureCollection | null | undefined
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (!fc?.features?.length) return isPointInBBox(lat, lng);
  const pt = point([lng, lat]);
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
    if (booleanPointInPolygon(pt, f as Feature<Polygon | MultiPolygon>)) return true;
  }
  return false;
}

export function parseCoord(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function roundCoord(n: number, decimals = 3): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
