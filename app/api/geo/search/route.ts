import { NextRequest, NextResponse } from "next/server";
import { geoUserAgent, NOMINATIM_VIEWBOX } from "@/lib/geo/constants";
import { enqueueNominatim } from "@/lib/geo/nominatimQueue";
import { clientIp, rateLimitIp } from "@/lib/geo/rateLimit";
import { requireAdminSession } from "@/lib/geo/requireAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }

  const ip = clientIp(req);
  if (!rateLimitIp(`search:${ip}`, 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "Troppe richieste" }, { status: 429 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ ok: false, error: "Query troppo corta" }, { status: 400 });
  }

  try {
    const data = await enqueueNominatim(async () => {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "5");
      url.searchParams.set("viewbox", NOMINATIM_VIEWBOX);
      url.searchParams.set("bounded", "1");
      url.searchParams.set("accept-language", "it");
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": geoUserAgent(), Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      return res.json() as Promise<
        Array<{ lat: string; lon: string; display_name: string; name?: string }>
      >;
    });

    const results = (Array.isArray(data) ? data : []).slice(0, 5).map((r) => ({
      name: r.name || r.display_name.split(",")[0]?.trim() || r.display_name,
      displayName: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.warn("[geo/search]", (err as Error).message);
    return NextResponse.json({ ok: false, error: "search_unavailable" }, { status: 502 });
  }
}
