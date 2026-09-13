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
  };
}
