import { NextRequest, NextResponse } from "next/server";
import { loadAreaGeojson } from "@/lib/geo/area.server";
import { isPointInOperatingArea, parseCoord, roundCoord } from "@/lib/geo/area";
import { geoUserAgent } from "@/lib/geo/constants";
import { LruCache } from "@/lib/geo/lru";
import { enqueueNominatim } from "@/lib/geo/nominatimQueue";
import { clientIp, rateLimitIp } from "@/lib/geo/rateLimit";

export const runtime = "nodejs";

type ReverseResult = {
  name: string;
  municipality: string | null;
  province: string | null;
  region: string | null;
};

const mem = new LruCache<ReverseResult>(300, 86_400_000);

function pickName(addr: Record<string, string | undefined>, fallback: string): string {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.suburb ||
    addr.municipality ||
    addr.city_district ||
    fallback
  );
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimitIp(ip, 40, 60_000)) {
    return NextResponse.json({ ok: false, error: "Troppe richieste" }, { status: 429 });
  }

  const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
  const lng = parseCoord(req.nextUrl.searchParams.get("lng"));
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "it";
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "Coordinate non valide" }, { status: 400 });
  }

  const area = loadAreaGeojson();
  if (!isPointInOperatingArea(lat, lng, area)) {
    return NextResponse.json({ ok: false, error: "out_of_area", outOfArea: true }, { status: 400 });
  }

  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  const cacheKey = `${rLat},${rLng},${lang}`;
  const hit = mem.get(cacheKey);
  if (hit) return NextResponse.json({ ok: true, ...hit, cached: true });

  try {
    const data = await enqueueNominatim(async () => {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(rLat));
      url.searchParams.set("lon", String(rLng));
      url.searchParams.set("zoom", "14");
      url.searchParams.set("accept-language", lang);
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": geoUserAgent(), Accept: "application/json" },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      return res.json() as Promise<{
        name?: string;
        display_name?: string;
        address?: Record<string, string>;
      }>;
    });

    const addr = data.address ?? {};
    const municipality = pickName(addr, "");
    const result: ReverseResult = {
      name: municipality || data.name || data.display_name?.split(",")[0]?.trim() || "",
      municipality: municipality || null,
      province: addr.county || addr.state_district || addr.province || null,
      region: addr.state || addr.region || null,
    };
    mem.set(cacheKey, result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.warn("[geo/reverse]", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "geo_unavailable" },
      { status: 502 }
    );
  }
}
