// ============================================================
// DATA LAYER — Funzioni pure per il fetch dei dati pubblici
// Tutte Server Side: importale nei Server Components
// o wrappale in Route Handlers se serve client-fetch
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Supabase = ReturnType<typeof createClient>;

// -----------------------------------------------------------------------------
// UI STRINGS (tutte le chiavi)
// -----------------------------------------------------------------------------
export async function fetchUiStrings(
  sb: Supabase = createClient()
) {
  const { data, error } = await sb
    .from("ui_strings")
    .select("key, it, en");
  if (error) throw new Error(`fetchUiStrings: ${error.message}`);
  return data ?? [];
}

// -----------------------------------------------------------------------------
// SECTION VISIBILITY — sezioni nascoste (stored in ui_strings)
// -----------------------------------------------------------------------------
export async function fetchHiddenSections(
  sb: Supabase = createClient()
): Promise<Record<string, boolean>> {
  const { data } = await sb
    .from("ui_strings")
    .select("key, it")
    .like("key", "section.hidden.%");
  const result: Record<string, boolean> = {};
  for (const row of (data ?? []) as any[]) {
    const sectionId = (row.key as string).replace("section.hidden.", "");
    if (row.it === "true") result[sectionId] = true;
  }
  return result;
}

// -----------------------------------------------------------------------------
// PROFILO (con join a contatti e credenziali)
// -----------------------------------------------------------------------------
export async function fetchProfile(
  sb: Supabase = createClient()
) {
  const { data, error } = await sb
    .from("profiles")
    .select(`
      *,
      contacts (*),
      credentials (*)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`fetchProfile: ${error.message}`);
  return data ?? null;
}

export async function fetchCvItems(
  sb: Supabase = createClient()
) {
  const { data, error } = await sb
    .from("cv_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`fetchCvItems: ${error.message}`);
  return data ?? [];
}

// -----------------------------------------------------------------------------
// TOUR TYPES (categorie)
// -----------------------------------------------------------------------------
export async function fetchTourTypes(
  sb: Supabase = createClient(),
  opts?: { onlyActive?: boolean; includeExclusive?: boolean; includeCustom?: boolean }
) {
  const { onlyActive = true } = opts ?? {};
  let q = sb.from("tour_types").select("*");
  if (onlyActive) q = q.eq("is_active", true);
  q = q.order("sort_order", { ascending: true });
  const { data, error } = await q;
  if (error) throw new Error(`fetchTourTypes: ${error.message}`);
  return data ?? [];
}

// -----------------------------------------------------------------------------
// PLACES (luoghi) — con join a place_type + tour_types
// -----------------------------------------------------------------------------
export async function fetchPlaces(
  sb: Supabase = createClient(),
  opts?: { onlyActive?: boolean; tourTypeSlug?: string }
) {
  const { onlyActive = true, tourTypeSlug } = opts ?? {};
  let q = sb
    .from("places")
    .select(`
      *,
      place_types (slug, name_it, name_en, icon),
      place_tour_types (
        tour_types (id, slug, name_it, name_en, color, icon, is_exclusive)
      )
    `);
  if (onlyActive) q = q.eq("is_active", true);
  if (tourTypeSlug) {
    // Equi-join via place_tour_types.tour_types.slug
    q = q.eq("place_tour_types.tour_types.slug", tourTypeSlug);
  }
  q = q.order("sort_order", { ascending: true });
  const { data, error } = await q;
  if (error) throw new Error(`fetchPlaces: ${error.message}`);
  const raw = (data ?? []) as any[];
  return raw.map((row: any) => ({
    ...row,
    place_type: row.place_types ?? null,
    place_tour_types: (row.place_tour_types ?? []).map((pt: any) => ({
      ...pt,
      tour_type: pt.tour_types ?? null,
    })),
  })) as (Database["public"]["Tables"]["places"]["Row"] & {
    place_type: { slug: string; name_it: string; name_en: string; icon: string | null } | null;
    place_tour_types: {
      tour_type: {
        id: string; slug: string; name_it: string; name_en: string;
        color: string; icon: string | null; is_exclusive: boolean;
      };
    }[];
  })[];
}

// -----------------------------------------------------------------------------
// EVENTS (prossime partenze)
// -----------------------------------------------------------------------------
export async function fetchEvents(
  sb: Supabase = createClient(),
  opts?: { onlyActive?: boolean; upcomingOnly?: boolean; limit?: number }
) {
  const { onlyActive = true, upcomingOnly = true, limit = 12 } = opts ?? {};
  
  let q = sb
    .from("events")
    .select(`
      *,
      tour_types!events_tour_type_id_fkey (id, slug, name_it, name_en, color, icon),
      event_places!event_places_event_id_fkey (
        places!event_places_place_id_fkey (id, slug, name_it, name_en, cover_image_url)
      )
    `);

  if (onlyActive) q = q.eq("is_active", true);
  if (upcomingOnly) q = q.gte("start_date", new Date().toISOString());
  
  q = q.order("start_date", { ascending: true }).limit(limit);
  
  const { data, error } = await q;
  if (error) throw new Error(`fetchEvents: ${error.message}`);
  
  const raw = (data ?? []) as any[];
  return raw.map((row: any) => ({
    ...row,
    tour_type: row.tour_types ?? null,
    event_places: (row.event_places ?? []).map((ep: any) => ({
      ...ep,
      place: ep.places ?? null,
    })),
  })) as (Database["public"]["Tables"]["events"]["Row"] & {
    tour_type: { id: string; slug: string; name_it: string; name_en: string; color: string; icon: string | null } | null;
    event_places: { place: { id: string; slug: string; name_it: string; name_en: string; cover_image_url: string | null } }[];
  })[];
}

// -----------------------------------------------------------------------------
// REVIEWS APPROVATE (Usa la vista per evitare problemi di cache sulle join)
// -----------------------------------------------------------------------------
export async function fetchApprovedReviews(
  sb: Supabase = createClient(),
  opts?: { limit?: number }
) {
  const { limit = 30 } = opts ?? {};
  
  // 1. Interroghiamo la VISTA invece della tabella diretta
  const { data, error } = await sb
    .from("reviews_with_tour")
    .select("*")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .limit(limit);
    
  if (error) throw new Error(`fetchApprovedReviews: ${error.message}`);
  
  // 2. Normalizziamo i dati per mantenerli 100% compatibili con il resto dell'app
  // Ricostruiamo l'oggetto "tour_type" esattamente come si aspettava il vecchio codice
  const normalizedReviews = (data ?? []).map((r: any) => ({
    ...r,
    tour_type: r.tour_type_id ? {
      name_it: r.tour_type_name_it,
      name_en: r.tour_type_name_en,
      color: r.tour_type_color
    } : null
  }));

  return normalizedReviews;
}

// -----------------------------------------------------------------------------
// INFO ITEMS (FAQ)
// -----------------------------------------------------------------------------
export async function fetchInfoItems(
  sb: Supabase = createClient()
) {
  const { data, error } = await sb
    .from("info_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`fetchInfoItems: ${error.message}`);
  return data ?? [];
}

// -----------------------------------------------------------------------------
// QUOTE (citazione di chiusura attiva)
// -----------------------------------------------------------------------------
export async function fetchActiveQuote(
  sb: Supabase = createClient()
) {
  const { data, error } = await sb
    .from("quotes")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`fetchActiveQuote: ${error.message}`);
  return data ?? null;
}

// -----------------------------------------------------------------------------
// MEDIA ITEMS (galleria)
// -----------------------------------------------------------------------------
export async function fetchMedia(
  sb: Supabase = createClient(),
  opts?: { onlyImages?: boolean; limit?: number }
) {
  const { onlyImages = false, limit = 30 } = opts ?? {};
  let q = sb.from("media_items").select("*").eq("is_active", true);
  if (onlyImages) q = q.eq("type", "image");
  q = q.order("sort_order", { ascending: true }).limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`fetchMedia: ${error.message}`);
  return data ?? [];
}

// -----------------------------------------------------------------------------
// BUNDLE — caricamento "tutto in una" per la home page pubblica
// -----------------------------------------------------------------------------
export async function fetchPublicHomeData(
  sb: Supabase = createClient()
) {
  const [
    uiStrings,
    profile,
    cvItems,
    tourTypes,
    places,
    events,
    reviews,
    infoItems,
    quote,
    media,
    hiddenSections,
  ] = await Promise.all([
    fetchUiStrings(sb),
    fetchProfile(sb),
    fetchCvItems(sb),
    fetchTourTypes(sb),
    fetchPlaces(sb),
    fetchEvents(sb),
    fetchApprovedReviews(sb, { limit: 12 }),
    fetchInfoItems(sb),
    fetchActiveQuote(sb),
    fetchMedia(sb, { limit: 20 }),
    fetchHiddenSections(sb),
  ]);

  return {
    uiStrings,
    profile,
    cvItems,
    tourTypes,
    places,
    events,
    reviews,
    infoItems,
    quote,
    media,
    hiddenSections,
  };
}

export type PublicMapReview = {
  id: string;
  author_name: string;
  author_location_it: string | null;
  author_location_en: string | null;
  review_text: string;
  rating: number;
  submitted_at: string;
  place_id: string | null;
  map_spot_id: string | null;
};

export type PublicMapPlace = Database["public"]["Tables"]["places"]["Row"] & {
  color: string;
  tour_type_ids: string[];
  avgRating: number | null;
  reviewCount: number;
  spotsCount?: number;
};

export type PublicMapSiblingSpot = {
  id: string;
  name_it: string;
  name_en: string;
  lat: number;
  lng: number;
};

export type PublicMapSpot = Database["public"]["Tables"]["map_spots"]["Row"] & {
  color: string;
  avgRating: number | null;
  reviewCount: number;
  tour_type_ids?: string[];
  parentPlace?: {
    id: string;
    slug: string;
    name_it: string;
    name_en: string;
    duration_hours: number | null;
    difficulty: "accessible" | "easy" | "moderate" | "challenging" | null;
    cover_image_url: string | null;
    short_description_it: string | null;
    short_description_en: string | null;
    tour_type_ids: string[];
  } | null;
  siblingSpots?: PublicMapSiblingSpot[];
};

export type PublicMapEvent = Database["public"]["Tables"]["events"]["Row"] & {
  lat: number;
  lng: number;
  color: string;
  place_id: string | null;
  place_name_it: string | null;
  place_name_en: string | null;
  tour_type: { id: string; slug: string; name_it: string; name_en: string; color: string; icon: string | null } | null;
};

export async function fetchPublicMapData(sb: Supabase = createClient()) {
  const [places, spots, tourTypesRaw, reviewsRes, eventsRes] = await Promise.all([
    fetchPlaces(sb),
    sb.from("map_spots").select("*").eq("is_active", true).order("sort_order"),
    fetchTourTypes(sb),
    sb
      .from("reviews")
      .select("id, author_name, author_location_it, author_location_en, review_text, rating, submitted_at, place_id, map_spot_id")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false }),
    sb
      .from("events")
      .select(`
        *,
        tour_types!events_tour_type_id_fkey (id, slug, name_it, name_en, color, icon),
        event_places!event_places_event_id_fkey (
          place_id,
          places!event_places_place_id_fkey (id, slug, name_it, name_en, lat, lng, cover_image_url)
        )
      `)
      .eq("is_active", true)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true }),
  ]);
  const tourTypes = tourTypesRaw as Database["public"]["Tables"]["tour_types"]["Row"][];

  if (spots.error) throw new Error(`fetchPublicMapData map_spots: ${spots.error.message}`);
  if (reviewsRes.error) throw new Error(`fetchPublicMapData reviews: ${reviewsRes.error.message}`);

  const reviews = (reviewsRes.data ?? []) as PublicMapReview[];
  const stats = new Map<string, { sum: number; n: number }>();
  const bump = (key: string, rating: number) => {
    const cur = stats.get(key) ?? { sum: 0, n: 0 };
    cur.sum += rating;
    cur.n += 1;
    stats.set(key, cur);
  };
  for (const r of reviews) {
    if (r.place_id) bump(`p:${r.place_id}`, r.rating);
    if (r.map_spot_id) bump(`s:${r.map_spot_id}`, r.rating);
  }

  const rawSpots = ((spots.data ?? []) as Database["public"]["Tables"]["map_spots"]["Row"][]).filter(
    (s) => s.lat != null && s.lng != null
  );

  // Set di ID dei luoghi che hanno già uno o più punti/tappe specifici in map_spots
  const placesWithSpots = new Set(rawSpots.map((s) => s.place_id).filter(Boolean));

  const allPlaces: PublicMapPlace[] = places.map((p) => {
    const ids = (p.place_tour_types ?? []).map((x) => x.tour_type.id).filter(Boolean);
    const firstColor = (p.place_tour_types ?? [])[0]?.tour_type?.color || "#9C1C1C";
    const st = stats.get(`p:${p.id}`);
    const mySpots = rawSpots.filter((s) => s.place_id === p.id);
    return {
      ...p,
      lat: p.lat != null ? Number(p.lat) : null,
      lng: p.lng != null ? Number(p.lng) : null,
      color: firstColor,
      tour_type_ids: ids,
      avgRating: st ? st.sum / st.n : null,
      reviewCount: st?.n ?? 0,
      spotsCount: mySpots.length,
    };
  });

  // Luoghi mostrati direttamente come singoli pin (hanno coordinate e non sono suddivisi in spot)
  const mappedPlaces: PublicMapPlace[] = allPlaces.filter(
    (p) => p.lat != null && p.lng != null && !placesWithSpots.has(p.id)
  );

  // Tappe / spot con dettagli del tour genitore e tappe sorelle
  const mappedSpots: PublicMapSpot[] = rawSpots.map((s) => {
    const parentPlace = s.place_id ? places.find((p) => p.id === s.place_id) : null;
    const parentTt = parentPlace?.place_tour_types?.[0]?.tour_type;
    const tt = tourTypes.find((t) => t.id === s.tour_type_id) || parentTt;
    const spotStats = stats.get(`s:${s.id}`);
    const parentStats = s.place_id ? stats.get(`p:${s.place_id}`) : null;
    const st = spotStats ?? parentStats;

    const parentTourTypeIds = (parentPlace?.place_tour_types ?? []).map((x) => x.tour_type.id).filter(Boolean);
    const ttIds = s.tour_type_id ? [s.tour_type_id] : parentTourTypeIds;

    const siblings: PublicMapSiblingSpot[] = s.place_id
      ? rawSpots
          .filter((x) => x.place_id === s.place_id && x.id !== s.id)
          .map((x) => ({
            id: x.id,
            name_it: x.name_it,
            name_en: x.name_en,
            lat: Number(x.lat),
            lng: Number(x.lng),
          }))
      : [];

    return {
      ...s,
      lat: Number(s.lat),
      lng: Number(s.lng),
      color: tt?.color || parentTt?.color || "#9C1C1C",
      tour_type_ids: ttIds,
      avgRating: st ? st.sum / st.n : null,
      reviewCount: st?.n ?? 0,
      parentPlace: parentPlace
        ? {
            id: parentPlace.id,
            slug: parentPlace.slug,
            name_it: parentPlace.name_it,
            name_en: parentPlace.name_en,
            duration_hours: parentPlace.duration_hours,
            difficulty: parentPlace.difficulty,
            cover_image_url: parentPlace.cover_image_url,
            short_description_it: parentPlace.short_description_it,
            short_description_en: parentPlace.short_description_en,
            tour_type_ids: parentTourTypeIds,
          }
        : null,
      siblingSpots: siblings,
    };
  });

  // Mappatura eventi futuri con coordinate derivate dai luoghi
  const mappedEvents: PublicMapEvent[] = [];
  for (const ev of (eventsRes.data ?? []) as any[]) {
    const epList = ev.event_places ?? [];
    const primaryPlace = epList[0]?.places ?? null;
    let lat: number | null = primaryPlace?.lat != null ? Number(primaryPlace.lat) : null;
    let lng: number | null = primaryPlace?.lng != null ? Number(primaryPlace.lng) : null;

    if ((lat == null || lng == null) && primaryPlace?.id) {
      const sp = rawSpots.find((s) => s.place_id === primaryPlace.id);
      if (sp) {
        lat = Number(sp.lat);
        lng = Number(sp.lng);
      }
    }

    if (lat != null && lng != null) {
      mappedEvents.push({
        ...ev,
        lat,
        lng,
        color: ev.tour_types?.color || "#B22A2A",
        place_id: primaryPlace?.id ?? null,
        place_name_it: primaryPlace?.name_it ?? null,
        place_name_en: primaryPlace?.name_en ?? null,
        tour_type: ev.tour_types ?? null,
      });
    }
  }

  return {
    places: mappedPlaces,
    allPlaces,
    spots: mappedSpots,
    events: mappedEvents,
    tourTypes,
    reviews,
  };
}
