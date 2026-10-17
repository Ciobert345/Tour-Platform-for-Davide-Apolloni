import fs from "fs";
import path from "path";
import type { FeatureCollection } from "geojson";

let cached: FeatureCollection | null | undefined;

export function loadAreaGeojson(): FeatureCollection | null {
  if (cached !== undefined) return cached;
  try {
    const p = path.join(process.cwd(), "public", "geo", "area.geojson");
    const raw = fs.readFileSync(p, "utf8");
    cached = JSON.parse(raw) as FeatureCollection;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
