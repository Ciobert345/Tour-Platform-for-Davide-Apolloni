import { NextRequest, NextResponse } from "next/server";
import { loadAreaGeojson } from "@/lib/geo/area.server";
import { isPointInOperatingArea, parseCoord, roundCoord } from "@/lib/geo/area";
import { geoUserAgent } from "@/lib/geo/constants";
import { LruCache } from "@/lib/geo/lru";
import { clientIp, rateLimitIp } from "@/lib/geo/rateLimit";
import { stripHtmlToText } from "@/lib/geo/stripHtml";

export const runtime = "nodejs";

export type CommonsPhoto = {
  url: string;
  thumbUrl: string;
  title: string;
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  descriptionUrl: string | null;
};

const mem = new LruCache<CommonsPhoto[]>(200, 86_400_000);

const ALLOWED_EXT = /\.(jpe?g|png)(\?|$)/i;
const BLOCKED_MIME = /(svg|pdf|tiff|tif|gif|webp|mp3|mp4|ogg|wav|webm|ogv)/i;

type ExtMeta = { value?: string; hidden?: string };

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimitIp(`photos:${ip}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "Troppe richieste" }, { status: 429 });
  }

  const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
  const lng = parseCoord(req.nextUrl.searchParams.get("lng"));
  if (lat == null || lng == null) {
    return NextResponse.json({ ok: false, error: "Coordinate non valide" }, { status: 400 });
  }

  const area = loadAreaGeojson();
  if (!isPointInOperatingArea(lat, lng, area)) {
    return NextResponse.json({ ok: false, error: "out_of_area", photos: [] }, { status: 400 });
  }

  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  const cacheKey = `${rLat},${rLng}`;
  const hit = mem.get(cacheKey);
  if (hit) return NextResponse.json({ ok: true, photos: hit, cached: true });

  try {
    // 1. Cerca prima voci enciclopediche e monumenti storici / città su Wikipedia
    const geoUrl = new URL("https://it.wikipedia.org/w/api.php");
    geoUrl.searchParams.set("action", "query");
    geoUrl.searchParams.set("list", "geosearch");
    geoUrl.searchParams.set("gscoord", `${rLat}|${rLng}`);
    geoUrl.searchParams.set("gsradius", "4000");
    geoUrl.searchParams.set("gslimit", "10");
    geoUrl.searchParams.set("format", "json");

    const geoRes = await fetch(geoUrl.toString(), {
      headers: { "User-Agent": geoUserAgent(), Accept: "application/json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });

    let photos: CommonsPhoto[] = [];

    if (geoRes.ok) {
      const geoJson = (await geoRes.json()) as {
        query?: { geosearch?: Array<{ title: string; dist: number }> };
      };
      const titles = (geoJson.query?.geosearch ?? []).map((x) => x.title).slice(0, 8);

      if (titles.length > 0) {
        const detailUrl = new URL("https://it.wikipedia.org/w/api.php");
        detailUrl.searchParams.set("action", "query");
        detailUrl.searchParams.set("prop", "pageimages|description");
        detailUrl.searchParams.set("piprop", "thumbnail");
        detailUrl.searchParams.set("pithumbsize", "800");
        detailUrl.searchParams.set("titles", titles.join("|"));
        detailUrl.searchParams.set("format", "json");

        const detRes = await fetch(detailUrl.toString(), {
          headers: { "User-Agent": geoUserAgent(), Accept: "application/json" },
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(8000),
        });

        if (detRes.ok) {
          const detJson = (await detRes.json()) as {
            query?: {
              pages?: Record<
                string,
                {
                  title?: string;
                  description?: string;
                  thumbnail?: { source?: string };
                }
              >;
            };
          };

          const pages = Object.values(detJson.query?.pages ?? {});
          for (const page of pages) {
            if (!page.thumbnail?.source) continue;
            photos.push({
              url: page.thumbnail.source,
              thumbUrl: page.thumbnail.source,
              title: page.title || "",
              author: page.description ? `Bene culturale / Storico: ${page.description}` : null,
              license: "Wikipedia / CC BY-SA",
              licenseUrl: `https://it.wikipedia.org/wiki/${encodeURIComponent(page.title || "")}`,
              descriptionUrl: `https://it.wikipedia.org/wiki/${encodeURIComponent(page.title || "")}`,
            });
            if (photos.length >= 8) break;
          }
        }
      }
    }

    mem.set(cacheKey, photos);
    return NextResponse.json({ ok: true, photos });
  } catch (err) {
    console.warn("[geo/photos]", (err as Error).message);
    return NextResponse.json({ ok: false, error: "photos_unavailable", photos: [] }, { status: 502 });
  }
}
