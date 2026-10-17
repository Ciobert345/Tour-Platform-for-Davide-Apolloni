"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import {
  X,
  MapPin,
  Compass,
  Calendar,
  Star,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Layers,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

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

function MapController({
  target,
  bounds,
}: {
  target: [number, number] | null;
  bounds?: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.8 });
    } else if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  }, [target, bounds, map]);
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

function CustomTourDropdown({
  tours,
  selectedId,
  onSelect,
  lang,
}: {
  tours: PublicMapPlace[];
  selectedId: string;
  onSelect: (id: string) => void;
  lang: "it" | "en";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedTour = tours.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const filteredTours = useMemo(() => {
    if (!search.trim()) return tours;
    const q = search.toLowerCase().trim();
    return tours.filter(
      (t) =>
        (t.name_it || "").toLowerCase().includes(q) ||
        (t.name_en || "").toLowerCase().includes(q) ||
        (t.short_description_it || "").toLowerCase().includes(q) ||
        (t.short_description_en || "").toLowerCase().includes(q)
    );
  }, [tours, search]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button - 100% OPACO, alto contrasto, solid background */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white dark:bg-[#1E1610] text-[#1E160A] dark:text-[#FAF0E3] border-2 border-[#D8C7B4] dark:border-[#3E2D1F] hover:border-[#9C1C1C]/60 dark:hover:border-[#9C1C1C]/60 transition-all flex items-center justify-between gap-2.5 text-left shadow-xs cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedTour?.cover_image_url ? (
            <img
              src={selectedTour.cover_image_url}
              alt=""
              className="w-7 h-7 rounded-md object-cover shrink-0 border border-black/10 dark:border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span className="w-7 h-7 rounded-md bg-[#9C1C1C]/10 dark:bg-[#9C1C1C]/20 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#9C1C1C] dark:text-[#fca59d]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#1E160A] dark:text-[#FAF0E3] truncate">
              {selectedTour
                ? (lang === "it" ? selectedTour.name_it : selectedTour.name_en)
                : `Tutti i tour inseriti (${tours.length})`}
            </div>
            {selectedTour?.spotsCount ? (
              <div className="text-[10px] font-semibold text-[#4A6535] dark:text-[#78a25c]">
                {selectedTour.spotsCount} tappe
              </div>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#7A6655] dark:text-[#B5A18C] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#9C1C1C] dark:text-[#fca59d]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown - 100% OPACO, SOLIDISSIMO, NESSUNA TRASPARENZA */}
      {open && (
        <div className="absolute z-[999] left-0 right-0 top-full mt-1.5 rounded-2xl bg-white dark:bg-[#18110B] border-2 border-[#C5B49E] dark:border-[#423020] shadow-[0_16px_48px_rgba(0,0,0,0.38)] p-2 max-h-[360px] overflow-y-auto space-y-1.5 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
          {/* Barra di ricerca rapida interna al menù a tendina */}
          <div className="relative pb-1">
            <Search className="w-3.5 h-3.5 text-[#7A6655] dark:text-[#B5A18C] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca tra i tour..."
              className="w-full h-8 pl-8 pr-7 rounded-xl bg-[#F7F2EA] dark:bg-[#221811] text-xs font-medium text-[#1E160A] dark:text-[#FAF0E3] placeholder-[#7A6655] dark:placeholder-[#9C8974] border border-[#D8C7B4] dark:border-[#382619] focus:outline-none focus:ring-1 focus:ring-[#9C1C1C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#7A6655] hover:text-[#1E160A] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Opzione: Tutti i tour */}
          <button
            type="button"
            onClick={() => {
              onSelect("all");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors border cursor-pointer ${
              selectedId === "all"
                ? "bg-[#9C1C1C]/10 border-[#9C1C1C]/40 text-[#9C1C1C] dark:text-[#fca59d]"
                : "bg-[#FDFCF9] dark:bg-[#1F1711] border-[#E8DDD0] dark:border-[#2F2116] text-[#1E160A] dark:text-[#FAF0E3] hover:bg-[#F3ECE1] dark:hover:bg-[#281D14]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#9C1C1C]" />
              <span>Tutti i tour inseriti ({tours.length})</span>
            </span>
            {selectedId === "all" && <Check className="w-4 h-4 text-[#9C1C1C]" />}
          </button>

          {/* Elenco Tour con Immagine, Titolo, Badge e Descrizione chiara */}
          {filteredTours.map((t) => {
            const isSelected = t.id === selectedId;
            const desc = lang === "it" ? t.short_description_it : t.short_description_en || t.short_description_it;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-all group border cursor-pointer ${
                  isSelected
                    ? "bg-[#9C1C1C]/10 border-2 border-[#9C1C1C] text-[#9C1C1C] dark:text-[#fca59d]"
                    : "bg-[#FDFCF9] dark:bg-[#1F1711] border-[#E8DDD0] dark:border-[#2F2116] text-[#1E160A] dark:text-[#FAF0E3] hover:bg-[#F3ECE1] dark:hover:bg-[#281D14] hover:border-[#9C1C1C]/40"
                }`}
              >
                {/* Immagine di copertina */}
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10 shrink-0 relative border border-black/10 dark:border-white/10">
                  {t.cover_image_url ? (
                    <img
                      src={t.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7A6655]">
                      <Compass className="w-4 h-4 text-[#9C1C1C]" />
                    </div>
                  )}
                </div>

                {/* Testi ad altissimo contrasto */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate text-[#1E160A] dark:text-[#FAF0E3]">
                      {lang === "it" ? t.name_it : t.name_en}
                    </span>
                    {t.spotsCount ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#4A6535] text-white shrink-0">
                        {t.spotsCount} tappe
                      </span>
                    ) : null}
                  </div>
                  {desc && (
                    <p className="text-[11px] font-normal text-[#473625] dark:text-[#D4C3AF] line-clamp-2 mt-0.5 leading-snug">
                      {desc}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomCategoryDropdown({
  categories,
  selectedId,
  onSelect,
  lang,
}: {
  categories: Database["public"]["Tables"]["tour_types"]["Row"][];
  selectedId: string;
  onSelect: (id: string) => void;
  lang: "it" | "en";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCat = categories.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button - 100% OPACO */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1E1610] text-[11px] font-bold text-[#1E160A] dark:text-[#FAF0E3] border-2 border-[#D8C7B4] dark:border-[#3E2D1F] hover:border-[#9C1C1C]/60 dark:hover:border-[#9C1C1C]/60 transition-colors flex items-center justify-between gap-2 text-left cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedCat ? (
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: selectedCat.color || "#9C1C1C" }}
            />
          ) : (
            <span className="w-3 h-3 rounded-full bg-[#7A6655] shrink-0" />
          )}
          <span className="truncate">
            {selectedCat ? (lang === "it" ? selectedCat.name_it : selectedCat.name_en) : "Tutte le categorie"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A6655] dark:text-[#B5A18C] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#9C1C1C]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown - 100% OPACO, NESSUNA TRASPARENZA */}
      {open && (
        <div className="absolute z-[999] left-0 right-0 top-full mt-1.5 rounded-2xl bg-white dark:bg-[#18110B] border-2 border-[#C5B49E] dark:border-[#423020] shadow-[0_16px_48px_rgba(0,0,0,0.38)] p-1.5 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              onSelect("all");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
              selectedId === "all"
                ? "bg-[#9C1C1C]/10 text-[#9C1C1C] dark:text-[#fca59d] font-bold"
                : "text-[#1E160A] dark:text-[#FAF0E3] hover:bg-[#F3ECE1] dark:hover:bg-[#281D14]"
            }`}
          >
            <span className="font-semibold">Tutte le categorie</span>
            {selectedId === "all" && <Check className="w-3.5 h-3.5 text-[#9C1C1C]" />}
          </button>

          {categories.map((c) => {
            const isSelected = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#9C1C1C]/10 text-[#9C1C1C] dark:text-[#fca59d] font-bold"
                    : "text-[#1E160A] dark:text-[#FAF0E3] hover:bg-[#F3ECE1] dark:hover:bg-[#281D14]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: c.color || "#9C1C1C" }}
                  />
                  <span className="truncate font-semibold">{lang === "it" ? c.name_it : c.name_en}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#9C1C1C]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const [selectedTourId, setSelectedTourId] = useState<string>("all");
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

  // Lista di tutti i tour specifici disponibili (ordinati alfabeticamente)
  const tourList = useMemo(() => {
    const list = allPlaces && allPlaces.length > 0 ? allPlaces : places;
    return [...list].sort((a, b) => (a.name_it || "").localeCompare(b.name_it || ""));
  }, [allPlaces, places]);

  // Tour / Luoghi da mostrare nel carosello (filtrati per categoria se attiva)
  const displayedCarouselTours = useMemo(() => {
    if (tourFilter === "all") return tourList;
    return tourList.filter((p) => p.tour_type_ids.includes(tourFilter));
  }, [tourList, tourFilter]);

  const carouselScrollRef = useRef<HTMLDivElement>(null);

  // Scorrimento automatico alla card attiva nel carosello quando viene selezionato un tour
  useEffect(() => {
    if (selectedTourId !== "all" && carouselScrollRef.current) {
      const activeEl = carouselScrollRef.current.querySelector<HTMLElement>(`[data-tour-id="${selectedTourId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedTourId]);

  const selectedTourPlace = useMemo(() => {
    if (selectedTourId === "all") return null;
    return tourList.find((p) => p.id === selectedTourId) ?? null;
  }, [tourList, selectedTourId]);

  const tourSpecificSpots = useMemo(() => {
    if (selectedTourId === "all") return [];
    return spots.filter((s) => s.place_id === selectedTourId);
  }, [spots, selectedTourId]);

  // Calcolo dei limiti geografici (bounds) per centrare la mappa su tutte le tappe del tour
  const tourBounds = useMemo(() => {
    if (selectedTourId === "all") return null;
    const pts: [number, number][] = [];
    const relSpots = spots.filter((s) => s.place_id === selectedTourId && s.lat != null && s.lng != null);
    relSpots.forEach((s) => pts.push([Number(s.lat), Number(s.lng)]));
    const relPlace = (allPlaces || places).find((p) => p.id === selectedTourId);
    if (relPlace && relPlace.lat != null && relPlace.lng != null) {
      pts.push([Number(relPlace.lat), Number(relPlace.lng)]);
    }
    if (pts.length < 2) return null;
    return L.latLngBounds(pts);
  }, [selectedTourId, spots, allPlaces, places]);

  const resetFilters = useCallback(() => {
    setShowPlaces(true);
    setShowSpots(true);
    setShowEvents(true);
    setOnlyReviewed(false);
    setTourFilter("all");
    setSelectedTourId("all");
  }, []);

  // Numero di filtri attivi (rispetto ai default)
  const activeFilterCount = [
    !showPlaces,
    !showSpots,
    !showEvents,
    onlyReviewed,
    tourFilter !== "all",
    selectedTourId !== "all",
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
      if (selectedTourId !== "all" && p.id !== selectedTourId) return false;
      if (onlyReviewed && !p.reviewCount) return false;
      if (tourFilter !== "all" && !p.tour_type_ids.includes(tourFilter)) return false;
      return true;
    });
  }, [places, showPlaces, onlyReviewed, tourFilter, selectedTourId]);

  const filteredSpots = useMemo(() => {
    if (!showSpots) return [];
    return spots.filter((s) => {
      if (selectedTourId !== "all" && s.place_id !== selectedTourId) return false;
      if (onlyReviewed && !s.reviewCount) return false;
      if (tourFilter !== "all") {
        const hasMatchingTt = s.tour_type_id === tourFilter || (s.tour_type_ids && s.tour_type_ids.includes(tourFilter));
        if (!hasMatchingTt) return false;
      }
      return true;
    });
  }, [spots, showSpots, onlyReviewed, tourFilter, selectedTourId]);

  const filteredEvents = useMemo(() => {
    if (!showEvents) return [];
    return events.filter((ev) => {
      if (selectedTourId !== "all" && ev.place_id !== selectedTourId) return false;
      if (onlyReviewed) return false;
      if (tourFilter !== "all" && ev.tour_type_id !== tourFilter) return false;
      return true;
    });
  }, [events, showEvents, onlyReviewed, tourFilter, selectedTourId]);

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
    if (!selection) {
      if (
        selectedTourId !== "all" &&
        !tourBounds &&
        selectedTourPlace &&
        selectedTourPlace.lat != null &&
        selectedTourPlace.lng != null
      ) {
        return [Number(selectedTourPlace.lat), Number(selectedTourPlace.lng)];
      }
      return null;
    }
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
  }, [selection, selectedTourId, tourBounds, selectedTourPlace]);

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#FAF4EB] dark:bg-[#1a140f]">
      {/* ===== BARRA DI CONTROLLO SUPERIORE SOSPESA (ISOLA UNIFICATA) ===== */}
      <div className="absolute z-[800] left-3 top-3 flex items-center gap-2 pointer-events-auto">
        {/* Pulsante FILTRI */}
        <button
          type="button"
          id="map-filter-btn"
          onClick={() => { setFiltersOpen((v) => !v); setLegendOpen(false); setInfoOpen(false); }}
          className={`relative h-10 px-3.5 sm:px-4 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border-2 shadow-lg cursor-pointer ${
            filtersOpen
              ? "bg-[#9C1C1C] text-white border-[#9C1C1C]"
              : "bg-white dark:bg-[#1A120B] text-[#1E160A] dark:text-[#FAF0E3] border-[#D8C7B4] dark:border-[#382619] hover:border-[#9C1C1C]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          <span>{t("map.filters", "Filtri")}</span>
          {activeFilterCount > 0 && (
            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
              filtersOpen ? "bg-white text-[#9C1C1C]" : "bg-[#9C1C1C] text-white"
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Badge del tour attualmente selezionato */}
        {selectedTourId !== "all" && selectedTourPlace && (
          <div className="h-10 px-3 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold bg-[#9C1C1C] text-white shadow-lg animate-in fade-in duration-150 border-2 border-[#9C1C1C]">
            <Compass className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[220px] truncate">
              {lang === "it" ? selectedTourPlace.name_it : selectedTourPlace.name_en}
            </span>
            <button
              type="button"
              onClick={() => setSelectedTourId("all")}
              className="p-1 rounded-full hover:bg-white/20 transition-colors ml-0.5 cursor-pointer"
              aria-label="Rimuovi filtro tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pulsante LEGENDA */}
        <button
          type="button"
          id="map-legend-btn"
          onClick={() => { setLegendOpen((v) => !v); setFiltersOpen(false); setInfoOpen(false); }}
          className={`h-10 px-3 sm:px-4 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border-2 shadow-lg cursor-pointer ${
            legendOpen
              ? "bg-[#C4923A] text-white border-[#C4923A]"
              : "bg-white dark:bg-[#1A120B] text-[#1E160A] dark:text-[#FAF0E3] border-[#D8C7B4] dark:border-[#382619] hover:border-[#C4923A]"
          }`}
          aria-label="Legenda"
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t("map.legend", "Legenda")}</span>
        </button>

        {/* Pulsante INFO / GUIDA MAPPA */}
        <button
          type="button"
          id="map-info-btn"
          onClick={() => { setInfoOpen((v) => !v); setFiltersOpen(false); setLegendOpen(false); }}
          aria-label="Come funziona la mappa"
          className={`h-10 w-10 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all cursor-pointer ${
            infoOpen
              ? "bg-[#9C1C1C] text-white border-[#9C1C1C]"
              : "bg-white dark:bg-[#1A120B] text-[#7A6655] dark:text-[#FAF0E3] border-[#D8C7B4] dark:border-[#382619] hover:border-[#9C1C1C]"
          }`}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* ===== PANNELLO FILTRI DELLA MAPPA (100% OPACO, NESSUNA TRASPARENZA) ===== */}
      {filtersOpen && (
        <div className="absolute z-[850] left-3 top-16 w-88 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-3xl bg-[#FAF5ED] dark:bg-[#140E0A] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-[#D8C7B4] dark:border-[#382619] animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#D8C7B4]/60 dark:border-[#382619] shrink-0">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#FAF0E3] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#9C1C1C]" />
              <span>{t("map.filters", "Filtri mappa")}</span>
            </span>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-[#9C1C1C] dark:text-[#fca59d] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t("map.resetFilters", "Reset")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-lg text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#FAF0E3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Chiudi filtri"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenuto scrollabile */}
          <div className="overflow-y-auto flex-1 pt-3.5 space-y-4 pr-1 custom-scrollbar">
            {/* Sezione 1: Tour / Itinerario specifico */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A2B] dark:text-[#d4a36b] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#9C1C1C]" />
                  <span>Tour / Itinerario</span>
                </p>
                {selectedTourId !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedTourId("all")}
                    className="text-[10.5px] font-semibold text-[#9C1C1C] dark:text-[#fca59d] hover:underline cursor-pointer"
                  >
                    mostra tutti
                  </button>
                )}
              </div>
              <CustomTourDropdown
                tours={tourList}
                selectedId={selectedTourId}
                onSelect={(id) => {
                  setSelectedTourId(id);
                  if (id !== "all") {
                    const p = tourList.find((x) => x.id === id);
                    if (p) onSelectEntity({ kind: "place", item: p });
                  }
                }}
                lang={lang}
              />
            </div>

            {/* Tappe dell'itinerario specifico selezionato (solo se un tour è attivo) */}
            {selectedTourId !== "all" && tourSpecificSpots.length > 0 && (
              <div className="rounded-2xl border-2 border-[#9C1C1C]/30 bg-[#9C1C1C]/5 dark:bg-[#9C1C1C]/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9C1C1C] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#4A6535]" />
                    <span>Tappe del tour ({tourSpecificSpots.length})</span>
                  </p>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {tourSpecificSpots.map((stop, idx) => (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => {
                        onSelectEntity({ kind: "spot", item: stop });
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E1610] text-[#1E160A] dark:text-[#FAF0E3] hover:border-[#9C1C1C] border border-[#E3D4C4] dark:border-[#382619] shadow-xs transition-all text-left group cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#4A6535] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate group-hover:text-[#9C1C1C] transition-colors">
                        {lang === "it" ? stop.name_it : stop.name_en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sezione 2: Categoria Tour */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A2B] dark:text-[#d4a36b]">
                Categoria
              </p>
              <CustomCategoryDropdown
                categories={tourTypes}
                selectedId={tourFilter}
                onSelect={(id) => setTourFilter(id)}
                lang={lang}
              />
            </div>

            {/* Sezione 3: Elementi visibili */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A2B] dark:text-[#d4a36b]">
                Elementi visibili
              </p>
              <div className="space-y-1.5">
                {[
                  { label: t("map.filterPlaces", "Luoghi delle visite"), icon: MapPin, active: showPlaces, color: "#9C1C1C", toggle: () => setShowPlaces((v) => !v), count: filteredPlaces.length },
                  { label: t("map.filterSpots", "Mete e tappe"), icon: Compass, active: showSpots, color: "#4A6535", toggle: () => setShowSpots((v) => !v), count: filteredSpots.length },
                  { label: t("map.filterEvents", "Prossimi eventi"), icon: Calendar, active: showEvents, color: "#9C1C1C", toggle: () => setShowEvents((v) => !v), count: filteredEvents.length },
                ].map(({ label, icon: Icon, active, color, toggle, count }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={toggle}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border cursor-pointer ${
                      active
                        ? "bg-white dark:bg-[#1E1610] border-[#D8C7B4] dark:border-[#3E2D1F] shadow-xs"
                        : "bg-[#F3ECE1] dark:bg-[#1A120B] border-transparent opacity-65 hover:opacity-100"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#1E160A] dark:text-[#FAF0E3]">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? color : undefined }} />
                      {label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#8A5A2B] dark:text-[#d4a36b]">{count}</span>
                      <span
                        className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                        style={active ? { background: color, borderColor: color } : { borderColor: "#A89682" }}
                      >
                        {active && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sezione 4: Filtro recensiti */}
            <div className="border-t border-[#D8C7B4]/60 dark:border-[#382619] pt-3">
              <button
                type="button"
                onClick={() => setOnlyReviewed((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border cursor-pointer ${
                  onlyReviewed
                    ? "bg-[#C4923A]/15 border-[#C4923A] text-[#1E160A] dark:text-[#FAF0E3]"
                    : "bg-white dark:bg-[#1E1610] border-[#D8C7B4] dark:border-[#3E2D1F] text-[#1E160A] dark:text-[#FAF0E3] hover:border-[#C4923A]/50 shadow-xs"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 shrink-0" style={{ color: onlyReviewed ? "#C4923A" : "#8A5A2B" }} />
                  {t("map.filterReviewed", "Solo luoghi con recensioni")}
                </span>
                <span
                  className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={onlyReviewed ? { background: "#C4923A", borderColor: "#C4923A" } : { borderColor: "#A89682" }}
                >
                  {onlyReviewed && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
              </button>
            </div>

            {/* Sezione 5: Tappe per categoria se non è selezionato un tour specifico */}
            {selectedTourId === "all" && tourFilter !== "all" && (() => {
              const catSpots = spots.filter((s) =>
                s.tour_type_id === tourFilter || (s.tour_type_ids && s.tour_type_ids.includes(tourFilter))
              );
              const catPlaces = (allPlaces || places).filter((p) =>
                p.tour_type_ids && p.tour_type_ids.includes(tourFilter)
              );
              const allStops = [
                ...catPlaces.map((p) => ({ id: p.id, name: lang === "it" ? p.name_it : p.name_en, kind: "place" as const, item: p })),
                ...catSpots.map((s) => ({ id: s.id, name: lang === "it" ? s.name_it : s.name_en, kind: "spot" as const, item: s })),
              ];
              if (allStops.length === 0) return null;
              return (
                <div className="border-t border-[#D8C7B4]/60 dark:border-[#382619] pt-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A2B] dark:text-[#d4a36b] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#4A6535]" />
                    {t("map.tourStops", "Tappe della categoria")} ({allStops.length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {allStops.map((stop) => (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => {
                          onSelectEntity({ kind: stop.kind, item: stop.item as any });
                          setFiltersOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E1610] text-[#1E160A] dark:text-[#FAF0E3] hover:border-[#9C1C1C] border border-[#E3D4C4] dark:border-[#382619] transition-all text-left cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#9C1C1C] shrink-0" />
                        <span className="truncate">{stop.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== SCHEDA LEGENDA SOSPESA (100% OPACA, NESSUNA TRASPARENZA) ===== */}
      {legendOpen && (
        <div className="absolute z-[850] left-3 top-16 w-80 rounded-3xl bg-[#FAF5ED] dark:bg-[#140E0A] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-[#D8C7B4] dark:border-[#382619] text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#D8C7B4]/60 dark:border-[#382619]">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#FAF0E3] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C4923A]" />
              <span>{t("map.legend", "Legenda della mappa")}</span>
            </span>
            <button
              type="button"
              onClick={() => setLegendOpen(false)}
              className="p-1 rounded-lg text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#FAF0E3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-[11px] text-[#473625] dark:text-[#D4C3AF]">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#9C1C1C] shrink-0 shadow-xs" />
              <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">{t("map.legendPlace", "Luoghi delle visite")}:</strong> itinerari e mete principali</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#4A6535] shrink-0" />
              <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">{t("map.legendSpot", "Mete proposte / Tappe")}:</strong> ville, palazzi, borghi specifici</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#9C1C1C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-2.5 h-2.5" />
              </span>
              <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">{t("map.legendEvent", "Prossimi eventi")}:</strong> date a calendario aperte alle prenotazioni</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#C4923A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Star className="w-2 h-2 fill-current" />
              </span>
              <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">{t("map.legendReviews", "Recensioni verificate")}:</strong> luoghi valutati dai partecipanti</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDA INFO "COME FUNZIONA" (100% OPACA, DALL'ALTO) ===== */}
      {infoOpen && (
        <div className="absolute z-[850] left-3 top-16 w-80 sm:w-88 max-w-[calc(100vw-1.5rem)] rounded-3xl bg-[#FAF5ED] dark:bg-[#140E0A] p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-[#D8C7B4] dark:border-[#382619] animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
          <div className="flex items-start justify-between mb-3 pb-2 border-b border-[#D8C7B4]/60 dark:border-[#382619]">
            <span className="font-serif font-bold text-sm text-[#1E160A] dark:text-[#FAF0E3] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#9C1C1C] shrink-0" />
              Come funziona la mappa
            </span>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="p-1 rounded-md text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#FAF0E3] ml-2 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-[11px] leading-relaxed text-[#473625] dark:text-[#D4C3AF]">
            <p>
              La mappa mostra tutti i <strong className="text-[#1E160A] dark:text-[#FAF0E3]">luoghi delle visite guidate</strong> condotte da Davide Apolloni nel Veneto e nella provincia di Trento.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C1C1C] shrink-0 mt-0.5" />
                <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">Punti pieni</strong> — luoghi delle visite guidate e itinerari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#4A6535] shrink-0 mt-0.5" />
                <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">Punti tratteggiati</strong> — mete e tappe specifiche (ville, borghi, palazzi)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C1C1C] flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-1.5 h-1.5 text-white" />
                </span>
                <span><strong className="text-[#1E160A] dark:text-[#FAF0E3]">Icona calendario</strong> — prossimi eventi aperti alle prenotazioni</span>
              </div>
            </div>
            <p className="pt-2 border-t border-[#D8C7B4]/60 dark:border-[#382619]">
              Clicca su qualunque punto per scoprire dettagli, foto e itinerari. Puoi anche toccare un punto libero all&rsquo;interno della regione per richiedere una visita personalizzata in quel luogo.
            </p>
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
        <MapController target={selectedTarget} bounds={tourBounds} />
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

      {/* ===== CAROSELLO INFERIORE SOSPESO DEI TOUR (ACCESSO VISIVO DIRETTO E PERMANENTE) ===== */}
      {!selection && (
        <div className="absolute z-[750] bottom-[84px] xl:bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-4rem)] md:max-w-5xl pointer-events-auto">
          <div className="w-full rounded-2xl sm:rounded-3xl bg-[#FAF5ED] dark:bg-[#140E0A] p-2 sm:p-3 shadow-[0_16px_48px_rgba(0,0,0,0.38)] border-2 border-[#D8C7B4] dark:border-[#382619] animate-in slide-in-from-bottom-2 duration-200">
            {/* Header del carosello */}
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 px-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#9C1C1C]/15 flex items-center justify-center text-[#9C1C1C] shrink-0">
                  <Compass className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-[#1E160A] dark:text-[#FAF0E3] truncate">
                    {tourFilter !== "all" ? "Luoghi filtrati per categoria" : "Luoghi & Itinerari nel Veneto"}
                  </h3>
                  <span className="text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#9C1C1C] text-white shrink-0">
                    {displayedCarouselTours.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Frecce di scorrimento desktop */}
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => carouselScrollRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#FAF0E3] transition-colors cursor-pointer"
                    aria-label="Scorri a sinistra"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => carouselScrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#7A6655] hover:text-[#1E160A] dark:hover:text-[#FAF0E3] transition-colors cursor-pointer"
                    aria-label="Scorri a destra"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedTourId !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedTourId("all")}
                    className="text-[10px] sm:text-[11px] font-bold text-[#9C1C1C] dark:text-[#fca59d] hover:underline px-2 py-0.5 rounded-lg bg-[#9C1C1C]/10 cursor-pointer"
                  >
                    Mostra tutti
                  </button>
                )}
              </div>
            </div>

            {/* Lista orizzontale a scorrimento con snap */}
            <div
              ref={carouselScrollRef}
              className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scroll-smooth snap-x snap-mandatory pr-1 sm:pr-2 custom-scrollbar"
            >
              {displayedCarouselTours.map((tour) => {
                const isSelected = selectedTourId === tour.id;
                const primaryTt = tourTypes.find((tt) => tour.tour_type_ids.includes(tt.id));
                const desc = lang === "it"
                  ? tour.short_description_it
                  : tour.short_description_en || tour.short_description_it;

                return (
                  <div
                    key={tour.id}
                    data-tour-id={tour.id}
                    onClick={() => {
                      if (isSelected) {
                        onSelectEntity({ kind: "place", item: tour });
                      } else {
                        setSelectedTourId(tour.id);
                      }
                    }}
                    className={`shrink-0 w-48 sm:w-56 md:w-64 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between border-2 transition-all cursor-pointer snap-start text-left group ${
                      isSelected
                        ? "bg-[#FFF9F2] dark:bg-[#20150E] border-[#9C1C1C] dark:border-[#C4923A] shadow-md ring-2 ring-[#9C1C1C]/25"
                        : "bg-white dark:bg-[#1A120B] border-[#D8C7B4] dark:border-[#332215] hover:border-[#9C1C1C]/70 shadow-xs"
                    }`}
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      {/* Immagine di copertina */}
                      <div className="relative w-full h-20 sm:h-24 md:h-26 rounded-lg sm:rounded-xl overflow-hidden bg-[#E8DDD0] dark:bg-[#2A1D13] shrink-0 border border-black/5 dark:border-white/5">
                        {tour.cover_image_url ? (
                          <img
                            src={tour.cover_image_url}
                            alt={tour.name_it || ""}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#7A6655] gap-1 p-2">
                            <Compass className="w-4 h-4 text-[#9C1C1C]" />
                            <span className="text-[9px] sm:text-[10px] text-center font-medium opacity-80">
                              {lang === "it" ? "Immagine non caricata" : "No image available"}
                            </span>
                          </div>
                        )}

                        {/* Badge categoria */}
                        {primaryTt && (
                          <span
                            className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 text-[8.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full text-white shadow-md"
                            style={{ backgroundColor: primaryTt.color || "#9C1C1C" }}
                          >
                            {lang === "it" ? primaryTt.name_it : primaryTt.name_en}
                          </span>
                        )}

                        {/* Badge numero tappe */}
                        {tour.spotsCount ? (
                          <span className="absolute bottom-1 sm:bottom-1.5 right-1 sm:right-1.5 text-[8.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#4A6535] text-white shadow-md">
                            {tour.spotsCount} tappe
                          </span>
                        ) : null}
                      </div>

                      {/* Testi card */}
                      <div>
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1E160A] dark:text-[#FAF0E3] leading-snug line-clamp-1 group-hover:text-[#9C1C1C] transition-colors">
                          {lang === "it" ? tour.name_it : tour.name_en}
                        </h4>
                        {desc && (
                          <p className="text-[10px] sm:text-[10.5px] text-[#473625] dark:text-[#D4C3AF] line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-snug">
                            {desc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer card */}
                    <div className="mt-1.5 sm:mt-2.5 pt-1.5 border-t border-[#D8C7B4]/60 dark:border-[#382619] flex items-center justify-between text-[9.5px] sm:text-[10px] font-bold">
                      <span className={isSelected ? "text-[#9C1C1C] dark:text-[#fca59d]" : "text-[#7A6655] dark:text-[#B5A18C]"}>
                        {isSelected ? "Attivo ✓" : "Centra"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity({ kind: "place", item: tour });
                        }}
                        className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#9C1C1C]/10 text-[#9C1C1C] dark:text-[#fca59d] hover:bg-[#9C1C1C] hover:text-white transition-colors cursor-pointer"
                        title="Apri scheda dettagli"
                      >
                        Dettagli →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDA EDITORIALE SOSPESA (DESKTOP, 100% OPACA) ===== */}
      {selection && (
        <aside className="hidden md:flex absolute right-4 top-4 bottom-4 w-[420px] max-w-[calc(100vw-2rem)] z-[900] bg-[#FAF5ED] dark:bg-[#140E0A] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-[#D8C7B4] dark:border-[#382619] flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
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
              onSelectPlaceId={(placeId) => {
                const p = (allPlaces || places).find((x) => x.id === placeId);
                if (p) onSelectEntity({ kind: "place", item: p });
              }}
            />
          </div>
        </aside>
      )}

      {/* ===== CASSETTO INFERIORE SOSPESO (MOBILE, 100% OPACO) ===== */}
      {selection && sheetOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[1100] max-h-[85vh] rounded-t-3xl bg-[#FAF5ED] dark:bg-[#140E0A] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] border-t-2 border-[#D8C7B4] dark:border-[#382619] flex flex-col animate-in slide-in-from-bottom duration-200">
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
              onSelectPlaceId={(placeId) => {
                const p = (allPlaces || places).find((x) => x.id === placeId);
                if (p) onSelectEntity({ kind: "place", item: p });
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
