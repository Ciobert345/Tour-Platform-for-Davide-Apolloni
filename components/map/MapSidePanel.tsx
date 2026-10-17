"use client";

import { useState, useEffect } from "react";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import type { PublicMapPlace, PublicMapReview, PublicMapSpot, PublicMapEvent } from "@/lib/data/public";
import type { Database } from "@/types/database.types";
import type { MapSelection, CommonsPhoto } from "@/components/map/MapExplorer";
import { Star, X, Calendar, Users, MapPin, Clock, ArrowRight, Compass, Check, ChevronLeft, ChevronRight, ExternalLink, ImageOff } from "lucide-react";

// ─── COVER IMAGE (with error fallback and name/coordinate-based fetch) ────────────────
function CoverImage({
  src,
  alt,
  searchName,
  lang,
  lat,
  lng,
}: {
  src: string | null;
  alt: string;
  searchName?: string | null;
  lang: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const [errored, setErrored] = useState(false);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  // Resetta lo stato ogni volta che cambiano i parametri di input della tappa
  useEffect(() => {
    setErrored(false);
    setFetchedUrl(null);
  }, [src, searchName, lat, lng]);

  useEffect(() => {
    // Se abbiamo già un src valido e non ha dato errore, usa l'immagine manuale senza fare fetch
    if (src && !errored) {
      setFetching(false);
      setFetchDone(true);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setFetchDone(false);

    const queryParam = searchName ? `&query=${encodeURIComponent(searchName)}` : "";
    const coordParam = lat != null && lng != null ? `lat=${lat}&lng=${lng}` : "";
    const params = coordParam ? `${coordParam}${queryParam}` : queryParam.replace(/^&/, "");

    if (!params) {
      setFetching(false);
      setFetchDone(true);
      return;
    }

    fetch(`/api/geo/photos?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.photos?.[0]?.url) {
          setFetchedUrl(json.photos[0].url);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setFetching(false);
          setFetchDone(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src, errored, searchName, lat, lng]);

  const displaySrc = !errored && src ? src : fetchedUrl;

  if (fetching && !displaySrc) {
    return (
      <div className="w-full h-44 rounded-xl mb-3 bg-black/5 dark:bg-white/5 animate-pulse flex items-center justify-center text-xs text-[#7A6655] dark:text-[#a89582]">
        <span className="opacity-70">{lang === "it" ? "Ricerca automatica foto..." : "Searching photo automatically..."}</span>
      </div>
    );
  }

  if (!displaySrc) {
    return (
      <div className="w-full h-36 rounded-xl mb-3 bg-black/[0.03] dark:bg-white/[0.04] flex flex-col items-center justify-center gap-2 border border-dashed border-black/15 dark:border-white/15">
        <ImageOff className="w-6 h-6 text-[#7A6655] dark:text-[#a89582] opacity-40" />
        <span className="text-xs text-[#7A6655] dark:text-[#a89582] font-medium">
          {lang === "it" ? "Immagine non disponibile" : "Image not available"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative mb-3 group">
      <img
        key={displaySrc}
        src={displaySrc}
        alt={alt}
        className="w-full h-44 object-cover rounded-xl shadow-sm"
        loading="lazy"
        onError={() => {
          if (displaySrc === src) {
            // Se la foto manuale (link o file) fallisce, fallback automatico su Wikipedia
            setErrored(true);
          } else {
            setFetchedUrl(null);
          }
        }}
      />
      {/* Badge discreto fonte immagine: Foto caricata vs Ricerca automatica */}
      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white/90 font-medium pointer-events-none">
        {!errored && src ? (lang === "it" ? "Foto ufficiale" : "Official photo") : "Wikipedia / Commons"}
      </span>
    </div>
  );
}

// ─── LIGHTBOX ──────────────────────────────────────────────────────────────────
function PhotoLightbox({ photos, initialIndex, onClose }: { photos: CommonsPhoto[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);
  const ph = photos[idx];

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-between p-3 sm:p-5 bg-black/95 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden"
      onClick={onClose}
    >
      {/* Barra superiore: contatore + tasto chiudi visibile */}
      <div
        className="w-full max-w-3xl mx-auto flex items-center justify-between shrink-0 z-10 py-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/70 text-xs font-mono font-medium tracking-wide">
          {idx + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          aria-label="Chiudi galleria"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Area immagine centrale: flex-1 con object-contain senza overflow */}
      <div
        className="relative w-full max-w-3xl mx-auto flex-1 min-h-0 flex items-center justify-center my-auto py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={ph.url}
          alt={ph.title}
          className="max-w-full max-h-[50vh] sm:max-h-[65vh] object-contain rounded-xl shadow-2xl"
          loading="lazy"
        />

        {/* Frecce navigazione */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg cursor-pointer"
              aria-label="Foto precedente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg cursor-pointer"
              aria-label="Foto successiva"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Didascalia e miniature */}
      <div
        className="w-full max-w-3xl mx-auto shrink-0 text-center pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white font-semibold text-xs sm:text-sm leading-snug line-clamp-2 max-w-xl mx-auto">
          {ph.title}
        </p>
        {ph.author && (
          <p className="text-white/60 text-[11px] mt-0.5 line-clamp-1">
            © {ph.author}
            {ph.license && <span className="ml-1 opacity-70">· {ph.license}</span>}
          </p>
        )}
        {ph.descriptionUrl && (
          <a
            href={ph.descriptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white/50 hover:text-white/80 text-[10.5px] mt-1 transition-colors"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Wikimedia Commons
          </a>
        )}

        {/* Strip miniature */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5 overflow-x-auto pb-1 max-w-full">
            {photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => setIdx(i)}
                className={`shrink-0 w-10 h-8 sm:w-12 sm:h-9 rounded-md overflow-hidden border-2 transition-all ${
                  i === idx ? "border-white opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-75"
                }`}
              >
                <img src={p.thumbUrl} alt={p.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PHOTO GRID ────────────────────────────────────────────────────────────────
function PhotoGrid({ photos }: { photos: CommonsPhoto[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (photos.length === 0) return null;

  // Layout: prima immagine grande + griglia sotto
  const [hero, ...rest] = photos;

  return (
    <>
      <div className="mt-3 space-y-1.5">
        {/* Hero */}
        <button
          type="button"
          onClick={() => setLightboxIdx(0)}
          className="relative w-full rounded-xl overflow-hidden shadow-md group block"
        >
          <img
            src={hero.thumbUrl}
            alt={hero.title}
            className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{hero.title}</p>
          </div>
          {photos.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              1 / {photos.length}
            </span>
          )}
        </button>

        {/* Grid (massimo 4 anteprime) */}
        {rest.length > 0 && (
          <div className={`grid gap-1.5 ${rest.length === 1 ? "grid-cols-1" : rest.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {rest.slice(0, 3).map((ph, i) => {
              const isLast = i === 2 && photos.length > 4;
              return (
                <button
                  key={ph.url}
                  type="button"
                  onClick={() => setLightboxIdx(i + 1)}
                  className="relative rounded-lg overflow-hidden group"
                >
                  <img
                    src={ph.thumbUrl}
                    alt={ph.title}
                    className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">+{photos.length - 4}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Attribution rapido */}
        {hero.author && (
          <p className="text-[9.5px] text-[#7A6655] dark:text-[#a89582] text-right pr-0.5">
            © {hero.author}
          </p>
        )}
      </div>

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

// ─── PANEL FRAME ───────────────────────────────────────────────────────────────
function PanelFrame({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="p-5 flex flex-col min-h-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="font-serif text-xl text-[#1E160A] dark:text-[#f5ede2] leading-tight">{title}</h2>
        <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5" aria-label={t("map.close")}>
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function MapSidePanel({
  selection,
  places,
  spots,
  reviews,
  tourTypes,
  onClose,
  onBook,
  onSelectSpotId,
  onSelectPlaceId,
}: {
  selection: MapSelection | null;
  places?: PublicMapPlace[];
  spots?: PublicMapSpot[];
  reviews: PublicMapReview[];
  tourTypes: Database["public"]["Tables"]["tour_types"]["Row"][];
  onClose: () => void;
  onBook: () => void;
  onSelectSpotId?: (spotId: string) => void;
  onSelectPlaceId?: (placeId: string) => void;
}) {
  const t = useT();
  const { lang } = useLang();

  if (!selection) return null;

  // --- FUORI AREA (non più triggerato, mantenuto per sicurezza) ---
  if (selection.kind === "free" && selection.outOfArea) {
    return (
      <PanelFrame title={t("map.outOfArea", "Area non coperta")} onClose={onClose}>
        <div className="p-4 rounded-md bg-[#9C1C1C]/10 border border-[#9C1C1C]/20 text-[#9C1C1C] text-sm">
          <p className="font-semibold mb-1">Fuori dall&apos;area operativa</p>
          <p className="text-xs opacity-90">
            Davide Apolloni opera esclusivamente nelle province del <strong>Veneto</strong> e del <strong>Trentino</strong>. Seleziona un punto all&apos;interno dei confini regionali.
          </p>
        </div>
      </PanelFrame>
    );
  }

  // --- PUNTO LIBERO ---
  if (selection.kind === "free") {
    return (
      <PanelFrame
        title={selection.loading ? t("map.locating", "Localizzazione...") : selection.name || t("map.placeUnknown", "Punto sulla mappa")}
        onClose={onClose}
      >
        {selection.loading && <div className="h-44 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />}
        {selection.error && <p className="text-sm text-[#9C1C1C]">{t("map.geoError")}</p>}

        {/* Gallery immagini */}
        {!selection.loading && (
          <>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6655] dark:text-[#a89582] mt-3">
              {selection.photos.length > 0 ? "Beni culturali e monumenti rilevati" : t("map.photos", "Immagini")}
            </h3>
            {selection.photosLoading && (
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            )}
            {!selection.photosLoading && selection.photos.length === 0 && (
              <div className="p-3 my-2 rounded-xl bg-[#FAF0E1] dark:bg-[#251e17] border border-[#E9DCC4] dark:border-[#382b20] text-xs text-[#7A6655] dark:text-[#c7b59f]">
                <p className="font-semibold text-[#1E160A] dark:text-[#f5ede2] mb-1">Nessun monumento identificato</p>
                <p>Clicca direttamente su un centro abitato, un borgo storico o un bene artistico per scoprirne le immagini e richiedere un itinerario.</p>
              </div>
            )}
            {!selection.photosLoading && selection.photos.length > 0 && (
              <PhotoGrid photos={selection.photos} />
            )}
          </>
        )}

        {!selection.loading && !selection.error && (
          <button type="button" onClick={onBook} className="mt-4 w-full h-10 rounded-xl bg-[#9C1C1C] hover:bg-[#7A1616] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t("map.customVisitCta", "Richiedi visita personalizzata qui")}
          </button>
        )}
      </PanelFrame>
    );
  }

  // --- SELEZIONE: EVENTO ---
  if (selection.kind === "event") {
    const ev = selection.item;
    const evTitle = lang === "it" ? ev.title_it : ev.title_en;
    const evDesc = (lang === "it" ? ev.description_it : ev.description_en) || "";
    const evDate = new Date(ev.start_date);
    const dateFormatted = evDate.toLocaleDateString(lang === "it" ? "it-IT" : "en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const timeFormatted = evDate.toLocaleTimeString(lang === "it" ? "it-IT" : "en-US", {
      hour: "2-digit", minute: "2-digit",
    });

    const tt = ev.tour_type;
    const remainingSeats = ev.total_seats != null ? Math.max(0, ev.total_seats - (ev.booked_seats || 0)) : null;

    const statusBadge = {
      open: { label: lang === "it" ? "Aperto" : "Open", bg: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300" },
      last_places: { label: lang === "it" ? "Ultimi posti" : "Last places", bg: "bg-amber-600/15 text-amber-800 dark:text-amber-300" },
      full: { label: lang === "it" ? "Tutto esaurito" : "Sold out", bg: "bg-neutral-600/15 text-neutral-800 dark:text-neutral-300" },
      closed: { label: lang === "it" ? "Chiuso" : "Closed", bg: "bg-neutral-600/15 text-neutral-800 dark:text-neutral-300" },
    }[ev.status] || { label: ev.status, bg: "bg-emerald-600/15 text-emerald-800" };

    return (
      <PanelFrame
        title={
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C1C1C] dark:text-[#e07a5f] flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{t("map.legendEvent", "Prossimo evento in programma")}</span>
            </span>
            <span>{evTitle}</span>
          </div>
        }
        onClose={onClose}
      >
        <CoverImage
          src={ev.cover_image_url || null}
          alt={evTitle}
          searchName={ev.title_it || ev.place_name_it}
          lang={lang}
          lat={Number(ev.lat) || null}
          lng={Number(ev.lng) || null}
        />

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {tt && (
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full shadow-sm"
              style={{ backgroundColor: tt.color }}
            >
              {lang === "it" ? tt.name_it : tt.name_en}
            </span>
          )}
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/70 dark:bg-[#251e17] border border-black/5 dark:border-white/10 space-y-2 mb-3 text-xs text-[#5C4C38] dark:text-[#d6c5b0]">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#9C1C1C] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1E160A] dark:text-[#f5ede2] capitalize">{dateFormatted}</p>
              <p className="text-[11px] text-[#7A6655] dark:text-[#a89582] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Ore {timeFormatted}
              </p>
            </div>
          </div>
          {ev.place_name_it && (
            <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
              <MapPin className="w-4 h-4 text-[#9C1C1C] shrink-0" />
              <p>
                <strong>{t("map.selectedPlace", "Luogo")}:</strong> {lang === "it" ? ev.place_name_it : ev.place_name_en}
              </p>
            </div>
          )}
          {remainingSeats != null && (
            <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
              <Users className="w-4 h-4 text-[#C4923A] shrink-0" />
              <p>
                <strong>{t("map.eventSeats", "Posti disponibili")}:</strong> {remainingSeats} di {ev.total_seats}
              </p>
            </div>
          )}
        </div>

        {evDesc && <p className="text-sm text-[#5C4C38] dark:text-[#d6c5b0] leading-relaxed mb-4">{evDesc}</p>}

        <button
          type="button"
          onClick={onBook}
          disabled={ev.status === "full" || ev.status === "closed"}
          className="mt-2 w-full h-11 rounded-xl bg-[#9C1C1C] hover:bg-[#7A1616] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>{t("map.bookEvent", "Prenota posto per l'evento")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </PanelFrame>
    );
  }

  // --- LUOGO O TAPPA ---
  const item = selection.item;
  const parentPlace =
    selection.kind === "spot"
      ? selection.item.parentPlace || (selection.item.place_id ? (places || []).find((p) => p.id === selection.item.place_id) : null)
      : null;

  const name = lang === "it" ? item.name_it : item.name_en;
  const parentName = parentPlace ? (lang === "it" ? parentPlace.name_it : parentPlace.name_en) : null;
  const desc =
    (lang === "it" ? item.short_description_it : item.short_description_en) ||
    (parentPlace ? (lang === "it" ? parentPlace.short_description_it : parentPlace.short_description_en) : "");

  // Per gli spot: usa SOLO l'immagine specifica della tappa (cover_image_url dello spot)
  // Se assente, NON usare la copertina del tour padre: cercheremo l'immagine per nome della tappa
  const coverImg = selection.kind === "spot"
    ? item.cover_image_url || null
    : item.cover_image_url || null;

  const related = reviews.filter((r) => {
    if (selection.kind === "place") return r.place_id === item.id;
    return r.map_spot_id === item.id || (parentPlace && r.place_id === parentPlace.id);
  });

  const tt =
    selection.kind === "spot"
      ? tourTypes.find((x) => x.id === selection.item.tour_type_id) ||
        (parentPlace ? tourTypes.find((x) => parentPlace.tour_type_ids.includes(x.id)) : null)
      : tourTypes.find((x) => selection.item.tour_type_ids.includes(x.id));

  const siblingSpots =
    selection.kind === "spot"
      ? selection.item.siblingSpots || (selection.item.place_id ? (spots || []).filter((s) => s.place_id === selection.item.place_id && s.id !== selection.item.id) : [])
      : (spots || []).filter((s) => s.place_id === selection.item.id);

  return (
    <PanelFrame
      title={
        <div>
          {parentName && (
            <button
              type="button"
              onClick={() => {
                const pid = parentPlace?.id || (selection.kind === "spot" ? selection.item.place_id : null);
                if (pid) onSelectPlaceId?.(pid);
              }}
              className="text-[11px] font-bold uppercase tracking-wider text-[#9C1C1C] dark:text-[#e07a5f] hover:underline flex items-center gap-1 mb-0.5 text-left cursor-pointer group"
            >
              <span>Tour: {parentName}</span>
              <ChevronLeft className="w-3 h-3 rotate-180 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <span>{name}</span>
        </div>
      }
      onClose={onClose}
    >
      <CoverImage
        key={`${selection.kind}-${item.id}-${coverImg || ""}`}
        src={coverImg}
        alt={name}
        searchName={item.name_it || item.name_en}
        lang={lang}
        lat={Number(item.lat) || null}
        lng={Number(item.lng) || null}
      />
      {tt && (
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full mb-2 shadow-sm" style={{ backgroundColor: tt.color }}>
          {lang === "it" ? tt.name_it : tt.name_en}
        </span>
      )}
      {desc && <p className="text-sm text-[#5C4C38] dark:text-[#d6c5b0] leading-relaxed">{desc}</p>}

      {(selection.kind === "place" || parentPlace) && (
        <div className="text-xs text-[#7A6655] dark:text-[#a89582] mt-2.5 p-2 rounded-lg bg-black/5 dark:bg-white/5 space-y-0.5">
          {(selection.kind === "place" ? selection.item.duration_hours : parentPlace?.duration_hours) != null && (
            <p><strong>{t("map.duration", "Durata")}:</strong> {selection.kind === "place" ? selection.item.duration_hours : parentPlace?.duration_hours} ore</p>
          )}
          {(selection.kind === "place" ? selection.item.difficulty : parentPlace?.difficulty) && (
            <p><strong>{t("map.difficulty", "Difficoltà")}:</strong> {selection.kind === "place" ? selection.item.difficulty : parentPlace?.difficulty}</p>
          )}
          {parentPlace && (
            <button
              type="button"
              onClick={() => {
                const pid = parentPlace.id || (selection.kind === "spot" ? selection.item.place_id : null);
                if (pid) onSelectPlaceId?.(pid);
              }}
              className="text-[#9C1C1C] dark:text-[#e07a5f] hover:underline font-medium pt-1 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Tappa dell&apos;itinerario &ldquo;{parentName}&rdquo; (Vedi panoramica tour)</span>
            </button>
          )}
        </div>
      )}

      {siblingSpots && siblingSpots.length > 0 && (
        <div className="mt-3.5 pt-3.5 border-t border-black/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#7A6655] dark:text-[#a89582] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#9C1C1C]" />
              {t("map.tourStops", "Tappe di questo tour")} ({siblingSpots.length + (selection.kind === "spot" ? 1 : 0)})
            </h4>
            <span className="text-[10px] text-[#7A6655] dark:text-[#a89582] opacity-75">
              {selection.kind === "place"
                ? (lang === "it" ? "Seleziona una tappa per vederla" : "Select a stop to view it")
                : (lang === "it" ? "Altre tappe del tour" : "Other tour stops")}
            </span>
          </div>

          {selection.kind === "place" ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
              {siblingSpots.map((sb, idx) => (
                <button
                  key={sb.id}
                  type="button"
                  onClick={() => onSelectSpotId?.(sb.id)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-[#251e17] hover:bg-white dark:hover:bg-[#2e2319] text-[#5C4C38] dark:text-[#d6c5b0] border border-black/10 dark:border-white/10 hover:border-[#9C1C1C] hover:text-[#9C1C1C] dark:hover:text-[#fca59d] transition-all shadow-xs text-left group cursor-pointer"
                >
                  {sb.cover_image_url ? (
                    <img
                      src={sb.cover_image_url}
                      alt={lang === "it" ? sb.name_it : sb.name_en}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10 dark:border-white/10"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#4A6535]/15 text-[#4A6535] dark:text-[#7ba65e] flex items-center justify-center shrink-0 font-bold text-xs">
                      {idx + 1}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1E160A] dark:text-[#f5ede2] group-hover:text-[#9C1C1C] dark:group-hover:text-[#fca59d] truncate">
                      {lang === "it" ? sb.name_it : sb.name_en}
                    </p>
                    <p className="text-[10px] text-[#7A6655] dark:text-[#a89582] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#9C1C1C] shrink-0" />
                      <span>
                        {lang === "it" ? `Tappa ${idx + 1}` : `Stop ${idx + 1}`}
                        {" · "}
                        {sb.cover_image_url ? (lang === "it" ? "Foto caricata" : "Custom photo") : (lang === "it" ? "Foto automatica" : "Auto photo")}
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7A6655] opacity-50 group-hover:opacity-100 group-hover:text-[#9C1C1C] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#9C1C1C] text-white shadow-sm">
                  <Check className="w-3 h-3" /> {name}
                </span>
                {siblingSpots.map((sb) => (
                  <button
                    key={sb.id}
                    type="button"
                    onClick={() => onSelectSpotId?.(sb.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-[#251e17] text-[#5C4C38] dark:text-[#d6c5b0] border border-black/10 dark:border-white/10 hover:border-[#9C1C1C] hover:text-[#9C1C1C] transition-all shadow-xs cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#9C1C1C]" />
                    <span>{lang === "it" ? sb.name_it : sb.name_en}</span>
                  </button>
                ))}
              </div>
              {parentPlace && (
                <button
                  type="button"
                  onClick={() => {
                    const pid = parentPlace.id || (selection.kind === "spot" ? selection.item.place_id : null);
                    if (pid) onSelectPlaceId?.(pid);
                  }}
                  className="text-[11px] text-[#7A6655] dark:text-[#a89582] hover:text-[#9C1C1C] dark:hover:text-[#fca59d] inline-flex items-center gap-1 hover:underline cursor-pointer pt-0.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === "it" ? `Torna a tutte le tappe di "${parentName}"` : `Back to all stops of "${parentName}"`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(selection.kind === "place" || parentPlace) && (() => {
        const targetTour = selection.kind === "place" ? item : parentPlace;
        const targetParam = targetTour?.id || targetTour?.slug || targetTour?.name_it || "";
        return (
          <a
            href="/#tour"
            onClick={() => {
              try {
                sessionStorage.setItem("highlight_tour", targetParam);
              } catch {
                // ignore
              }
            }}
            className="text-xs font-bold text-[#9C1C1C] dark:text-[#fca59d] hover:underline mt-2.5 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t("map.viewDetails", "Vedi la scheda")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        );
      })()}

      <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6655] dark:text-[#a89582] mb-2 flex items-center justify-between">
          <span>{t("map.reviews", "Recensioni")}</span>
          {item.reviewCount ? (
            <span className="text-[#C4923A] font-semibold flex items-center gap-1">
              <span>{item.avgRating?.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>({item.reviewCount})</span>
            </span>
          ) : null}
        </h3>
        {related.length === 0 ? (
          <p className="text-xs text-[#7A6655] dark:text-[#a89582] italic">{t("map.noReviews", "Nessuna recensione ancora per questo luogo.")}</p>
        ) : (
          <ul className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {related.map((r) => (
              <li key={r.id} className="text-xs bg-white/60 dark:bg-[#251e17] p-2.5 rounded-lg border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#1E160A] dark:text-[#f5ede2]">{r.author_name}</p>
                  <p className="text-[11px] text-[#C4923A] font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> {r.rating}/5
                  </p>
                </div>
                <p className="text-[#5C4C38] dark:text-[#d6c5b0] mt-1 line-clamp-3">{r.review_text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onBook}
        className="mt-4 w-full h-10 rounded-xl bg-[#9C1C1C] hover:bg-[#7A1616] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
      >
        <MapPin className="w-3.5 h-3.5" />
        {t("map.bookHere", "Richiedi visita guidata")}
      </button>
    </PanelFrame>
  );
}
