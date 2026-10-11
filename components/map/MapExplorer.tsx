"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { FeatureCollection } from "geojson";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import { isPointInOperatingArea } from "@/lib/geo/area";
import {
  MAP_BOUNDS,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/lib/geo/constants";
import type {
  PublicMapPlace,
  PublicMapReview,
  PublicMapSpot,
  PublicMapEvent,
} from "@/lib/data/public";
import type { Database } from "@/types/database.types";
import MapSidePanel from "@/components/map/MapSidePanel";
import MapBookingDrawer from "@/components/map/MapBookingDrawer";
import { X, MapPin, Compass, Calendar, Star, SlidersHorizontal, Check, RotateCcw, Layers, Info } from "lucide-react";

export type MapSelection =
  | { kind: "place"; item: PublicMapPlace }
  | { kind: "spot"; item: PublicMapSpot }
  | { kind: "event"; item: PublicMapEvent }
  | {
      kind: "free";
      lat: number;
      lng: number;
      name: string;
      municipality: string | null;
      loading: boolean;
      error: boolean;
      outOfArea: boolean;
      photos: CommonsPhoto[];
      photosLoading: boolean;
    };

export type CommonsPhoto = {
  url: string;
  thumbUrl: string;
  title: string;
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  descriptionUrl: string | null;
};

export type BookingMapContext = {
  source: "map";
  destination: string;
  tourTypeId: string | null;
  mapLat: number;
  mapLng: number;
  placeId: string | null;
  mapSpotId: string | null;
};

function makeIcon(color: string, dashed: boolean, withStar: boolean, isEvent?: boolean) {
  if (isEvent) {
    return L.divIcon({
      className: "da-map-pin da-map-pin-event",
      html: `<span style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#9C1C1C;color:#fff;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.45);cursor:pointer;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  const ring = dashed
    ? `box-shadow:0 0 0 2px ${color};background:transparent;border:2px dashed ${color};`
    : `background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);`;
  const star = withStar
    ? `<span style="position:absolute;top:-6px;right:-6px;display:flex;align-items:center;justify-content:center;width:12px;height:12px;border-radius:50%;background:#C4923A;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);">
        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </span>`
    : "";
  return L.divIcon({
    className: "da-map-pin",
    html: `<span style="position:relative;display:block;width:16px;height:16px;border-radius:50%;${ring}">${star}</span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function ClusterLayer({
  places,
  spots,
  events,
  onSelect,
}: {
  places: PublicMapPlace[];
  spots: PublicMapSpot[];
  events: PublicMapEvent[];
  onSelect: (s: MapSelection) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="da-cluster-badge"><span class="da-cluster-inner">${count}</span></div>`,
          className: "da-cluster-marker",
          iconSize: L.point(42, 42),
          iconAnchor: L.point(21, 21),
        });
      },
    });

    // Markers per luoghi
    for (const p of places) {
      if (p.lat == null || p.lng == null) continue;
      const m = L.marker([Number(p.lat), Number(p.lng)], {
        icon: makeIcon(p.color, false, (p.reviewCount ?? 0) > 0),
        title: p.name_it,
      });
      m.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ kind: "place", item: p });
      });
      group.addLayer(m);
    }

    // Markers per tappe / mete proposte
    for (const s of spots) {
      if (s.lat == null || s.lng == null) continue;
      const m = L.marker([Number(s.lat), Number(s.lng)], {
        icon: makeIcon(s.color, true, (s.reviewCount ?? 0) > 0),
        title: s.name_it,
      });
      m.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ kind: "spot", item: s });
      });
      group.addLayer(m);
    }

    // Markers per prossimi eventi
    for (const ev of events) {
      if (ev.lat == null || ev.lng == null) continue;
      const m = L.marker([Number(ev.lat), Number(ev.lng)], {
        icon: makeIcon(ev.color || "#9C1C1C", false, false, true),
        title: `Evento: ${ev.title_it}`,
        zIndexOffset: 200,
      });
      m.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ kind: "event", item: ev });
      });
      group.addLayer(m);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, places, spots, events, onSelect]);

  return null;
}

function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

function MapClick({
  area,
  onFree,
}: {
  area: FeatureCollection | null;
  onFree: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Click fuori dall'area operativa → ignorato silenziosamente
      if (!isPointInOperatingArea(lat, lng, area)) return;
      onFree(lat, lng);
    },
  });
  return null;
}

function BoundFix() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(L.latLngBounds(MAP_BOUNDS[0], MAP_BOUNDS[1]));
    map.options.maxBoundsViscosity = 0.85;
  }, [map]);
  return null;
}

function RenaissanceMaskDefs({ isDark }: { isDark: boolean }) {
  const map = useMap();

  useEffect(() => {
    const injectDefs = () => {
      const pane = map.getPanes()?.overlayPane;
      if (!pane) return;
      const svgs = pane.querySelectorAll("svg");
      svgs.forEach((svg) => {
        let defs = svg.querySelector("defs");
        if (!defs) {
          defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          svg.insertBefore(defs, svg.firstChild);
        }

        let pattern = defs.querySelector("#renaissance-mask-pattern");
        if (!pattern) {
          pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
          pattern.setAttribute("id", "renaissance-mask-pattern");
          pattern.setAttribute("patternUnits", "userSpaceOnUse");
          defs.appendChild(pattern);
        }

        pattern.setAttribute("width", "40");
        pattern.setAttribute("height", "40");

        const strokeColor = isDark ? "#D4A359" : "#9A7347";
        const strokeOpacity = isDark ? 0.08 : 0.06;

        pattern.innerHTML = `
          <!-- Filigrana cartografica geometrica ultra-fine, discreta e non invasiva -->
          <path d="M0,40 L40,0 M0,0 L40,40" stroke="${strokeColor}" stroke-width="0.5" stroke-opacity="${strokeOpacity}" />
        `;
      });
    };

    injectDefs();
    const timer = setTimeout(injectDefs, 80);
    map.on("layeradd", injectDefs);
    return () => {
      clearTimeout(timer);
      map.off("layeradd", injectDefs);
    };
  }, [map, isDark]);

  return null;
}

export default function MapExplorer({
  places,
  allPlaces,
  spots,
  events = [],
  tourTypes,
  reviews,
}: {
  places: PublicMapPlace[];
  allPlaces?: PublicMapPlace[];
  spots: PublicMapSpot[];
  events?: PublicMapEvent[];
  tourTypes: Database["public"]["Tables"]["tour_types"]["Row"][];
  reviews: PublicMapReview[];
  showTeaser?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const [area, setArea] = useState<FeatureCollection | null>(null);
  const [mask, setMask] = useState<FeatureCollection | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tourFilter, setTourFilter] = useState<string>("all");
  const [showPlaces, setShowPlaces] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [onlyReviewed, setOnlyReviewed] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [booking, setBooking] = useState<BookingMapContext | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Numero di filtri attivi (rispetto ai default)
  const activeFilterCount = [
    !showPlaces,
    !showSpots,
    !showEvents,
    onlyReviewed,
    tourFilter !== "all",
  ].filter(Boolean).length;

  // Renderer con buffer esteso (padding: 1.5) per eliminare qualsiasi lag o scatto visivo durante il trascinamento
  const svgRenderer = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return L.svg({ padding: 1.5 });
  }, []);

  useEffect(() => {
    void fetch("/geo/area.geojson")
      .then((r) => r.json())
      .then((g: FeatureCollection) => setArea(g))
      .catch(() => setArea(null));

    void fetch("/geo/mask.geojson")
      .then((r) => r.json())
      .then((m: FeatureCollection) => setMask(m))
      .catch(() => setMask(null));

    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (booking) setBooking(null);
        else {
          setSelection(null);
          setSheetOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking]);

  const filteredPlaces = useMemo(() => {
    if (!showPlaces) return [];
    return places.filter((p) => {
      if (onlyReviewed && !p.reviewCount) return false;
      if (tourFilter !== "all" && !p.tour_type_ids.includes(tourFilter)) return false;
      return true;
    });
  }, [places, showPlaces, onlyReviewed, tourFilter]);

  const filteredSpots = useMemo(() => {
    if (!showSpots) return [];
    return spots.filter((s) => {
      if (onlyReviewed && !s.reviewCount) return false;
      if (tourFilter !== "all") {
        const hasMatchingTt = s.tour_type_id === tourFilter || (s.tour_type_ids && s.tour_type_ids.includes(tourFilter));
        if (!hasMatchingTt) return false;
      }
      return true;
    });
  }, [spots, showSpots, onlyReviewed, tourFilter]);

  const filteredEvents = useMemo(() => {
    if (!showEvents) return [];
    return events.filter((ev) => {
      if (onlyReviewed) return false;
      if (tourFilter !== "all" && ev.tour_type_id !== tourFilter) return false;
      return true;
    });
  }, [events, showEvents, onlyReviewed, tourFilter]);

  const lookupFree = useCallback(async (lat: number, lng: number) => {
    setSelection({
      kind: "free",
      lat,
      lng,
      name: "",
      municipality: null,
      loading: true,
      error: false,
      outOfArea: false,
      photos: [],
      photosLoading: true,
    });
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}&lang=${lang}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSelection((prev) =>
          prev?.kind === "free"
            ? { ...prev, loading: false, error: true, photosLoading: false }
            : prev
        );
        return;
      }
      setSelection((prev) =>
        prev?.kind === "free"
          ? {
              ...prev,
              loading: false,
              name: json.name || json.municipality || "",
              municipality: json.municipality ?? null,
            }
          : prev
      );
    } catch {
      setSelection((prev) =>
        prev?.kind === "free" ? { ...prev, loading: false, error: true, photosLoading: false } : prev
      );
      return;
    }
    try {
      const res = await fetch(`/api/geo/photos?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      setSelection((prev) =>
        prev?.kind === "free"
          ? { ...prev, photosLoading: false, photos: json.photos ?? [] }
          : prev
      );
    } catch {
      setSelection((prev) =>
        prev?.kind === "free" ? { ...prev, photosLoading: false } : prev
      );
    }
  }, [lang]);

  const onSelectEntity = useCallback((s: MapSelection) => {
    setSelection(s);
    setSheetOpen(true);
  }, []);

  const customTourId = tourTypes.find((tt) => tt.is_custom_tour)?.id ?? null;

  const openBooking = () => {
    if (!selection) return;
    if (selection.kind === "place") {
      setBooking({
        source: "map",
        destination: lang === "it" ? selection.item.name_it : selection.item.name_en,
        tourTypeId: selection.item.tour_type_ids[0] ?? customTourId,
        mapLat: Number(selection.item.lat),
        mapLng: Number(selection.item.lng),
        placeId: selection.item.id,
        mapSpotId: null,
      });
    } else if (selection.kind === "spot") {
      setBooking({
        source: "map",
        destination: lang === "it" ? selection.item.name_it : selection.item.name_en,
        tourTypeId: selection.item.tour_type_id ?? customTourId,
        mapLat: Number(selection.item.lat),
        mapLng: Number(selection.item.lng),
        placeId: selection.item.place_id,
        mapSpotId: selection.item.id,
      });
    } else if (selection.kind === "event") {
      setBooking({
        source: "map",
        destination: `${lang === "it" ? selection.item.title_it : selection.item.title_en} (${new Date(selection.item.start_date).toLocaleDateString()})`,
        tourTypeId: selection.item.tour_type_id ?? customTourId,
        mapLat: Number(selection.item.lat),
        mapLng: Number(selection.item.lng),
        placeId: selection.item.place_id,
        mapSpotId: null,
      });
    } else if (selection.kind === "free" && !selection.outOfArea && !selection.loading) {
      setBooking({
        source: "map",
        destination: selection.name || t("map.placeUnknown", "Luogo senza nome"),
        tourTypeId: customTourId,
        mapLat: selection.lat,
        mapLng: selection.lng,
        placeId: null,
        mapSpotId: null,
      });
    }
  };

  const tempPos =
    selection?.kind === "free" ? ([selection.lat, selection.lng] as [number, number]) : null;

  const selectedTarget = useMemo((): [number, number] | null => {
    if (!selection) return null;
    if (selection.kind === "place" && selection.item.lat != null && selection.item.lng != null) {
      return [Number(selection.item.lat), Number(selection.item.lng)];
    }
    if (selection.kind === "spot" && selection.item.lat != null && selection.item.lng != null) {
      return [Number(selection.item.lat), Number(selection.item.lng)];
    }
    if (selection.kind === "event" && selection.item.lat != null && selection.item.lng != null) {
      return [Number(selection.item.lat), Number(selection.item.lng)];
    }
    return null;
  }, [selection]);

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#FAF4EB] dark:bg-[#1a140f]">
      {/* ===== BARRA DI CONTROLLO SUPERIORE SOSPESA (ISOLA UNIFICATA) ===== */}
      <div className="absolute z-[800] left-3 top-3 flex items-center gap-2 pointer-events-auto">
        {/* Pulsante FILTRI */}
        <button
          type="button"
          id="map-filter-btn"
          onClick={() => { setFiltersOpen((v) => !v); setLegendOpen(false); }}
          className={`relative h-9 px-3.5 rounded-2xl flex items-center gap-2 text-[12px] font-semibold transition-all border shadow-lg backdrop-blur-md ${
            filtersOpen
              ? "bg-[#9C1C1C] text-white border-[#9C1C1C]/80"
              : "bg-white/95 dark:bg-[#1c1611]/95 text-[#5C4C38] dark:text-[#c7b59f] border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#1c1611]"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>{t("map.filters", "Filtri")}</span>
          {activeFilterCount > 0 && (
            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
              filtersOpen ? "bg-white/30 text-white" : "bg-[#9C1C1C] text-white"
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Pulsante LEGENDA */}
        <button
          type="button"
          id="map-legend-btn"
          onClick={() => { setLegendOpen((v) => !v); setFiltersOpen(false); }}
          className={`h-9 px-3.5 rounded-2xl flex items-center gap-2 text-[12px] font-semibold transition-all border shadow-lg backdrop-blur-md ${
            legendOpen
              ? "bg-[#C4923A] text-white border-[#C4923A]/80"
              : "bg-white/95 dark:bg-[#1c1611]/95 text-[#5C4C38] dark:text-[#c7b59f] border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#1c1611]"
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{t("map.legend", "Legenda")}</span>
        </button>
      </div>

      {/* ===== PANNELLO FILTRI COMPATTO ===== */}
      {filtersOpen && (
        <div className="absolute z-[850] left-3 top-14 w-72 rounded-2xl bg-white/97 dark:bg-[#1c1611]/97 backdrop-blur-md p-4 shadow-2xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#f5ede2] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#9C1C1C]" />
              {t("map.filters", "Filtri mappa")}
            </span>
            <div className="flex items-center gap-1.5">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowPlaces(true); setShowSpots(true); setShowEvents(true); setOnlyReviewed(false); setTourFilter("all"); }}
                  className="text-[10px] text-[#9C1C1C] dark:text-[#e07a5f] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  {t("map.resetFilters", "Reset")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-md text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#f5ede2]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selettore Tour */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A7347] dark:text-[#c49a5a]">Tipo di tour</p>
            <select
              aria-label={t("map.filterAllTours")}
              value={tourFilter}
              onChange={(e) => setTourFilter(e.target.value)}
              className="w-full h-8 px-3 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-medium text-[#1E160A] dark:text-[#f5ede2] border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:ring-1 focus:ring-[#9C1C1C] cursor-pointer"
            >
              <option value="all">{t("map.filterAllTours", "Tutti i tour")}</option>
              {tourTypes.map((tt) => (
                <option key={tt.id} value={tt.id} className="bg-white dark:bg-[#1c1611]">
                  {lang === "it" ? tt.name_it : tt.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Mostra/nascondi categorie */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A7347] dark:text-[#c49a5a]">Categorie visibili</p>
            <div className="space-y-1">
              {[
                { label: t("map.filterPlaces", "Luoghi delle visite"), icon: MapPin, active: showPlaces, color: "#9C1C1C", toggle: () => setShowPlaces((v) => !v), count: filteredPlaces.length },
                { label: t("map.filterSpots", "Mete e tappe"), icon: Compass, active: showSpots, color: "#4A6535", toggle: () => setShowSpots((v) => !v), count: filteredSpots.length },
                { label: t("map.filterEvents", "Prossimi eventi"), icon: Calendar, active: showEvents, color: "#9C1C1C", toggle: () => setShowEvents((v) => !v), count: filteredEvents.length },
              ].map(({ label, icon: Icon, active, color, toggle, count }) => (
                <button
                  key={label}
                  type="button"
                  onClick={toggle}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group"
                  style={active ? { background: `${color}14` } : {}}
                >
                  <span className="flex items-center gap-2 text-[11px] font-medium text-[#1E160A] dark:text-[#f5ede2]">
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? color : undefined }} />
                    {label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#9A7347] dark:text-[#c49a5a]">{count}</span>
                    <span
                      className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                      style={active ? { background: color, borderColor: color } : { borderColor: "#C5B49A" }}
                    >
                      {active && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro recensiti */}
          <div className="border-t border-black/8 dark:border-white/8 pt-3">
            <button
              type="button"
              onClick={() => setOnlyReviewed((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
              style={onlyReviewed ? { background: "#C4923A22" } : {}}
            >
              <span className="flex items-center gap-2 text-[11px] font-medium text-[#1E160A] dark:text-[#f5ede2]">
                <Star className="w-3.5 h-3.5 shrink-0" style={{ color: onlyReviewed ? "#C4923A" : undefined }} />
                {t("map.filterReviewed", "Solo luoghi con recensioni")}
              </span>
              <span
                className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                style={onlyReviewed ? { background: "#C4923A", borderColor: "#C4923A" } : { borderColor: "#C5B49A" }}
              >
                {onlyReviewed && <Check className="w-2.5 h-2.5 text-white" />}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ===== SCHEDA LEGENDA SOSPESA (RICHIUDIBILE) ===== */}
      {legendOpen && (
        <div className="absolute z-[850] left-3 top-16 w-80 rounded-2xl bg-white/95 dark:bg-[#1c1611]/95 backdrop-blur-md p-4 shadow-2xl border border-black/10 dark:border-white/10 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-black/8 dark:border-white/8">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#f5ede2] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C4923A]" />
              <span>{t("map.legend", "Legenda della mappa")}</span>
            </span>
            <button
              type="button"
              onClick={() => setLegendOpen(false)}
              className="p-1 rounded-md text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#f5ede2]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-[11px] text-[#5C4C38] dark:text-[#d6c5b0]">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#9C1C1C] shrink-0 shadow-xs" />
              <span><strong>{t("map.legendPlace", "Luoghi delle visite")}:</strong> itinerari e mete principali</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#4A6535] shrink-0" />
              <span><strong>{t("map.legendSpot", "Mete proposte / Tappe")}:</strong> ville, palazzi, borghi specifici</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#9C1C1C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-2.5 h-2.5" />
              </span>
              <span><strong>{t("map.legendEvent", "Prossimi eventi")}:</strong> date a calendario aperte alle prenotazioni</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#C4923A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Star className="w-2 h-2 fill-current" />
              </span>
              <span><strong>{t("map.legendReviews", "Recensioni verificate")}:</strong> luoghi valutati dai partecipanti</span>
            </div>
          </div>
        </div>
      )}

      {/* Vignetta perimetrale ed effetto cartografico rinascimentale */}
      <div className="pointer-events-none absolute inset-0 z-[400] shadow-[inset_0_0_70px_rgba(74,53,37,0.14)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.20)]" />

      {/* Rosa dei Venti decorativa classica in alto a destra */}
      <div className="pointer-events-none absolute right-4 top-4 z-[400] opacity-25 dark:opacity-20 hidden sm:block">
        <svg width="76" height="76" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#9C1C1C" strokeWidth="1" strokeDasharray="3 3"/>
          <circle cx="50" cy="50" r="38" stroke="#C4923A" strokeWidth="1"/>
          <path d="M50 4L54 46L96 50L54 54L50 96L46 54L4 50L46 46Z" fill="#9C1C1C" fillOpacity="0.45"/>
          <path d="M50 18L53 47L82 50L53 53L50 82L47 53L18 50L47 47Z" fill="#C4923A" fillOpacity="0.6"/>
          <circle cx="50" cy="50" r="3.5" fill="#9C1C1C"/>
          <text x="50" y="14" textAnchor="middle" fontSize="9" fontFamily="serif" fontWeight="bold" fill="#9C1C1C">N</text>
        </svg>
      </div>

      {/* MAPPA A SCHERMO INTERO */}
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="h-full w-full z-0"
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        renderer={svgRenderer}
      >
        <TileLayer
          attribution=""
          url={MAP_TILE_URL}
        />
        <BoundFix />
        <RenaissanceMaskDefs isDark={isDark} />
        <MapController target={selectedTarget} />
        {mask && (
          <>
            {/* Velo base di oscuramento — bianco/crema in light, nero in dark */}
            <GeoJSON
              key={`mask-base-${isDark ? "dark" : "light"}`}
              data={mask}
              interactive={false}
              style={{
                stroke: false,
                fillColor: isDark ? "#060403" : "#FAF4EB",
                fillOpacity: isDark ? 0.88 : 0.84,
              }}
            />
            {/* Tratteggio cartografico geometrico rinascimentale sovrapposto */}
            <GeoJSON
              key={`mask-pattern-${isDark ? "dark" : "light"}`}
              data={mask}
              interactive={false}
              style={{
                stroke: false,
                fillColor: "url(#renaissance-mask-pattern)",
                fillOpacity: 1,
              }}
            />
          </>
        )}
        {area && (
          <>
            {/* Alone caldo esterno per delimitare Veneto e Trentino */}
            <GeoJSON
              key={`regional-glow-${isDark ? "dark" : "light"}`}
              data={area}
              interactive={false}
              style={{
                color: isDark ? "#E8B868" : "#C4923A",
                weight: 5,
                opacity: isDark ? 0.7 : 0.55,
                fill: false,
              }}
            />
            {/* Confine cartografico a tratto raffinato */}
            <GeoJSON
              key={`regional-borders-${isDark ? "dark" : "light"}`}
              data={area}
              interactive={false}
              style={{
                color: isDark ? "#FCEEC8" : "#9C1C1C",
                weight: 2.2,
                opacity: 0.95,
                dashArray: "6, 6",
                fill: false,
              }}
            />
          </>
        )}
        <ClusterLayer
          places={filteredPlaces}
          spots={filteredSpots}
          events={filteredEvents}
          onSelect={onSelectEntity}
        />
        <MapClick
          area={area}
          onFree={(lat, lng) => void lookupFree(lat, lng)}
        />
        {tempPos && (
          <CircleMarker
            center={tempPos}
            radius={8}
            pathOptions={{ color: "#9C1C1C", fillColor: "#C4923A", fillOpacity: 0.9 }}
          />
        )}
      </MapContainer>

      {/* ===== SUGGERIMENTO DI INTERAZIONE IN BASSO (SE NESSUNA SELEZIONE) ===== */}
      {!selection && (
        <div className="pointer-events-none absolute bottom-[88px] md:bottom-4 left-4 right-14 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto z-[700] px-4 py-2 rounded-full bg-white/95 dark:bg-[#1c1611]/95 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg flex items-center gap-2 text-xs font-medium text-[#5C4C38] dark:text-[#c7b59f]">
          <Compass className="w-3.5 h-3.5 text-[#9C1C1C] shrink-0" />
          <span>{t("map.hintSelect", "Tocca un punto o un luogo sulla mappa per scoprire itinerari e tappe")}</span>
        </div>
      )}

      {/* ===== PULSANTE INFO + PANNELLO "COME FUNZIONA" ===== */}
      <button
        type="button"
        id="map-info-btn"
        onClick={() => { setInfoOpen((v) => !v); setFiltersOpen(false); setLegendOpen(false); }}
        aria-label="Come funziona la mappa"
        className={`absolute bottom-[88px] md:bottom-4 right-4 z-[800] w-9 h-9 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-md transition-all pointer-events-auto ${
          infoOpen
            ? "bg-[#9C1C1C] text-white border-[#9C1C1C]/80"
            : "bg-white/95 dark:bg-[#1c1611]/95 text-[#7A6655] dark:text-[#c7b59f] border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#1c1611]"
        }`}
      >
        <Info className="w-4 h-4" />
      </button>

      {infoOpen && (
        <div className="absolute z-[850] bottom-[148px] md:bottom-16 right-4 w-80 rounded-2xl bg-white/97 dark:bg-[#1c1611]/97 backdrop-blur-md p-5 shadow-2xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
          <div className="flex items-start justify-between mb-3">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#f5ede2] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#9C1C1C] shrink-0" />
              Come funziona la mappa
            </span>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="p-1 rounded-md text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#f5ede2] ml-2 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3 text-[11px] leading-relaxed text-[#5C4C38] dark:text-[#d6c5b0]">
            <p>
              La mappa mostra tutti i <strong className="text-[#1E160A] dark:text-[#f5ede2]">luoghi delle visite guidate</strong> condotte da Davide Apolloni nel Veneto e nella provincia di Trento.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C1C1C] shrink-0 mt-0.5" />
                <span><strong className="text-[#1E160A] dark:text-[#f5ede2]">Punti pieni</strong> — luoghi delle visite guidate e itinerari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#4A6535] shrink-0 mt-0.5" />
                <span><strong className="text-[#1E160A] dark:text-[#f5ede2]">Punti tratteggiati</strong> — mete e tappe specifiche (ville, borghi, palazzi)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C1C1C] flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-1.5 h-1.5 text-white" />
                </span>
                <span><strong className="text-[#1E160A] dark:text-[#f5ede2]">Icona calendario</strong> — prossimi eventi aperti alle prenotazioni</span>
              </div>
            </div>
            <p className="pt-1 border-t border-black/8 dark:border-white/8">
              Clicca su qualunque punto per scoprire dettagli, foto e itinerari. Puoi anche toccare un punto libero all&rsquo;interno della regione per richiedere una visita personalizzata in quel luogo.
            </p>
          </div>
        </div>
      )}

      {/* ===== SCHEDA EDITORIALE SOSPESA (DESKTOP) ===== */}
      {selection && (
        <aside className="hidden md:flex absolute right-4 top-4 bottom-4 w-[420px] max-w-[calc(100vw-2rem)] z-[900] bg-white/95 dark:bg-[#1c1611]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="overflow-y-auto flex-1">
            <MapSidePanel
              selection={selection}
              places={allPlaces || places}
              spots={spots}
              reviews={reviews}
              tourTypes={tourTypes}
              onClose={() => setSelection(null)}
              onBook={openBooking}
              onSelectSpotId={(spotId) => {
                const sp = spots.find((s) => s.id === spotId);
                if (sp) onSelectEntity({ kind: "spot", item: sp });
              }}
            />
          </div>
        </aside>
      )}

      {/* ===== CASSETTO INFERIORE SOSPESO (MOBILE) ===== */}
      {selection && sheetOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[1100] max-h-[85vh] rounded-t-3xl bg-white/95 dark:bg-[#1c1611]/95 backdrop-blur-md shadow-2xl border-t border-black/10 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <span className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20" />
          </div>
          <div className="overflow-y-auto flex-1 pb-4">
            <MapSidePanel
              selection={selection}
              places={allPlaces || places}
              spots={spots}
              reviews={reviews}
              tourTypes={tourTypes}
              onClose={() => { setSheetOpen(false); setSelection(null); }}
              onBook={openBooking}
              onSelectSpotId={(spotId) => {
                const sp = spots.find((s) => s.id === spotId);
                if (sp) onSelectEntity({ kind: "spot", item: sp });
              }}
            />
          </div>
        </div>
      )}

      {/* CASSETTO PRENOTAZIONE / RICHIESTA VISITA */}
      {booking && (
        <MapBookingDrawer
          context={booking}
          tourTypes={tourTypes}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}
