"use client";

import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { tFieldStr, tArrField, placeFullDescription, cn } from "@/lib/utils";
import { renderWithLinks } from "@/lib/renderWithLinks";
import { triggerBookingPrefill } from "@/lib/bookingPrefill";
import { Clock, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import MobileCarousel from "@/components/public/MobileCarousel";
import ReadMoreModal from "@/components/public/ReadMoreModal";
import type { Database, Lang } from "@/types/database.types";
import { optimizeImageUrl, BLUR_DATA_URL } from "@/lib/imageUtils";

type PlaceT = Database["public"]["Tables"]["places"]["Row"] & {
  place_type: { slug: string; name_it: string; name_en: string; icon: string | null } | null;
  place_tour_types: {
    tour_type: {
      id: string; slug: string; name_it: string; name_en: string;
      color: string; icon: string | null; is_exclusive: boolean;
    };
  }[];
};
type TourTypeT = Database["public"]["Tables"]["tour_types"]["Row"];
type TFn = (k: string, f?: string) => string;

const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=720&q=75",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=720&q=75",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=75",
];

/* Altezza identica per tutte le card: ogni blocco ha altezza riservata */
const CARD_CLASS =
  "card-base card-hover flex flex-col bg-white dark:bg-bg-card rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden h-full grow min-h-[560px] sm:min-h-[660px]";

/**
 * Tours section
 * - Mostra i "place card" (luoghi) raggruppati per tour type
 * - Filtra fuori i luoghi delle "esperienze esclusive" (mostrati nella sezione apposita)
 */
export default function ToursSection({
  places = [],
  tourTypes = [],
  defaultHidden = false,
}: {
  places?: PlaceT[] | null;
  tourTypes?: TourTypeT[] | null;
  defaultHidden?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();

  // Guardia difensiva: places potrebbe arrivare undefined in edge case
  const safePlaces = Array.isArray(places) ? places : [];

  // Filtra fuori i luoghi contrassegnati come esperienze esclusive (memoizzato per evitare re-render continui)
  const standardPlaces = useMemo(
    () => safePlaces.filter((p) => !p.place_tour_types?.some((pt) => pt.tour_type.is_exclusive)),
    [safePlaces]
  );

  const [highlightedTourId, setHighlightedTourId] = useState<string | null>(null);

  // Timer dedicato di 5 secondi: fa svanire il bagliore e azzera lo stato
  useEffect(() => {
    if (!highlightedTourId) return;

    const timer = setTimeout(() => {
      setHighlightedTourId(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [highlightedTourId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Legge il tour da evidenziare dal sessionStorage (impostato da "Vedi la scheda" nella mappa)
    let rawQuery: string | null = null;
    try {
      rawQuery = sessionStorage.getItem("highlight_tour");
      if (rawQuery) {
        // CANCELLA SUBITO: token consumato al primo atterraggio, non potrà MAI più rieseguirsi al ricaricamento (F5)
        sessionStorage.removeItem("highlight_tour");
      }
    } catch {
      // ignore
    }

    // 2. Fallback se qualcuno apre direttamente un link esterno con ?tour=
    if (!rawQuery) {
      const params = new URLSearchParams(window.location.search);
      rawQuery = params.get("tour") || params.get("select");
      if (rawQuery) {
        try {
          window.history.replaceState(null, "", window.location.pathname + (window.location.hash || "#tour"));
        } catch {
          // ignore
        }
      }
    }

    if (!rawQuery) return;

    const clean = (s: string | null) => (s ? decodeURIComponent(s).trim().toLowerCase() : "");
    const qTour = clean(rawQuery);

    // Ricerca in standardPlaces
    const match = standardPlaces.find((p) => {
      const pid = clean(p.id);
      const pslug = clean(p.slug);
      const pnameIt = clean(p.name_it);
      const pnameEn = clean(p.name_en);

      if (qTour && (pid === qTour || p.id === rawQuery)) return true;
      if (qTour && pslug && (pslug === qTour || pslug.includes(qTour) || qTour.includes(pslug))) return true;
      if (qTour && pnameIt && (pnameIt === qTour || pnameIt.includes(qTour) || qTour.includes(pnameIt))) return true;
      if (qTour && pnameEn && (pnameEn === qTour || pnameEn.includes(qTour) || qTour.includes(pnameEn))) return true;
      return false;
    });

    const matchedId = match ? match.id : null;

    if (matchedId) {
      setHighlightedTourId(matchedId);

      const performScroll = () => {
        const cardEl = document.getElementById(`tour-card-${matchedId}`);
        const sectionEl = document.getElementById("tour");

        if (cardEl) {
          // 1. Centra verticalmente e orizzontalmente la card nella finestra
          cardEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

          // 2. Perfeziona la centratura orizzontale nello scroller del carosello
          const scroller = cardEl.closest(".overflow-x-auto") as HTMLElement | null;
          if (scroller) {
            const scrollerRect = scroller.getBoundingClientRect();
            const cardRect = cardEl.getBoundingClientRect();
            const currentScrollLeft = scroller.scrollLeft;
            const cardOffsetInScroller = cardRect.left - scrollerRect.left + currentScrollLeft;
            const targetLeft = cardOffsetInScroller - (scroller.clientWidth - cardRect.width) / 2;
            scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
          }
        } else if (sectionEl) {
          const sectionTop = sectionEl.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: Math.max(0, sectionTop), behavior: "smooth" });
        }
      };

      performScroll();
      const t1 = setTimeout(performScroll, 120);
      const t2 = setTimeout(performScroll, 400);
      const t3 = setTimeout(performScroll, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [standardPlaces]);

  return (
    <section id="tour" className="section bg-bg-main" style={defaultHidden ? { display: "none" } : undefined}>
      <div className="container-app">
        <EditableSectionHeading
          section="Tour"
          subtitleKey="tours.subtitle"
          titleKey="tours.title"
          descKey="tours.desc"
        />
        <div className="section-divider">
          <span className="w-12 h-px bg-gold/50" />
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="w-12 h-px bg-gold/50" />
        </div>

        <LiveEditSectionMask
          sectionId="tour"
          adminHref="/admin/places"
          adminLabel="Luoghi"
          hint="Card dei luoghi e itinerari. Le categorie tour si gestiscono in Categorie Tour."
          minHeight="min-h-[420px]"
          defaultHidden={defaultHidden}
        >
          {standardPlaces.length === 0 ? (
            <FallbackTourCards t={t} lang={lang} highlightedId={highlightedTourId} />
          ) : (
            <PlaceCardsCarousel lang={lang}>
              {standardPlaces.map((p, idx) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  lang={lang}
                  t={t}
                  ttId={p.place_tour_types?.[0]?.tour_type?.id}
                  fallbackIdx={idx}
                  isHighlighted={highlightedTourId === p.id}
                />
              ))}
            </PlaceCardsCarousel>
          )}
        </LiveEditSectionMask>
      </div>
    </section>
  );
}

function PlaceCardsCarousel({
  children,
  lang,
}: {
  children: ReactNode;
  lang: Lang;
}) {
  const count = Children.count(children);
  return (
    <MobileCarousel
      hint={lang === "it" ? "← Scorri per vedere tutti i tour →" : "← Swipe to see all tours →"}
      desktopMode={count > 3 ? "scroll" : "grid"}
    >
      {children}
    </MobileCarousel>
  );
}

/* =========================================================
   PlaceCard — card da DB
   ========================================================= */
function PlaceCard({
  place,
  lang,
  t,
  ttId,
  fallbackIdx = 0,
  isHighlighted = false,
}: {
  place: PlaceT;
  lang: Lang;
  t: TFn;
  ttId?: string;
  fallbackIdx?: number;
  isHighlighted?: boolean;
}) {
  const rawCover = place.cover_image_url?.trim();
  const cover =
    rawCover && rawCover.length > 0
      ? rawCover
      : DEFAULT_COVERS[fallbackIdx % DEFAULT_COVERS.length];

  const tags = tArrField(place as any, "tags", lang);
  const placeTypeName = tFieldStr((place.place_type ?? {}) as any, "name", lang);
  const durationHours = place.duration_hours ?? null;
  const hoursText =
    durationHours !== null
      ? lang === "it"
        ? `${String(durationHours).replace(".", ",")} ${durationHours === 1 ? "ora" : "ore"}`
        : `${durationHours} ${durationHours === 1 ? "hour" : "hours"}`
      : "";
  const durationLabel =
    durationHours !== null
      ? `${durationHours <= 2.5
        ? lang === "it" ? "Mezza giornata" : "Half day"
        : lang === "it" ? "Giornata intera" : "Full day"
      } · ${hoursText}`
      : null;

  const [modalOpen, setModalOpen] = useState(false);
  const descText = tFieldStr(place as any, "short_description", lang);
  const fullText = placeFullDescription(place as any, lang);
  const itinerary = tFieldStr(place as any, "itinerary", lang);
  const name = tFieldStr(place as any, "name", lang);
  const resolvedTtId = ttId ?? place.place_tour_types?.[0]?.tour_type?.id;
  const closeLabel = lang === "it" ? "Chiudi" : "Close";

  return (
    <CardShell
      id={`tour-card-${place.id}`}
      isHighlighted={isHighlighted}
      cover={cover}
      alt={name || "Itinerario"}
      placeTypeName={placeTypeName}
      name={name}
      descNode={renderWithLinks(descText)}
      tags={tags}
      durationLabel={durationLabel}
      lang={lang}
      t={t}
      onMore={() => setModalOpen(true)}
      onBook={() => triggerBookingPrefill({ tourTypeId: resolvedTtId, destination: name })}
    >
      <ReadMoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={name}
        body={fullText}
        cover={cover}
        badge={placeTypeName}
        closeLabel={closeLabel}
        footer={
          <button
            type="button"
            onClick={() => {
              setModalOpen(false);
              triggerBookingPrefill({ tourTypeId: resolvedTtId, destination: name });
            }}
            className="btn btn-primary w-full justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {t("tours.btnBook", lang === "it" ? "Prenota" : "Book")}
          </button>
        }
      >
        {durationLabel && (
          <span className="chip inline-flex items-center gap-1 font-semibold text-terracotta bg-terracotta/10 border-terracotta/20 text-xs w-fit">
            <Clock className="w-3 h-3" />
            {durationLabel}
          </span>
        )}
        {itinerary.trim() && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60 mb-2">
              {lang === "it" ? "Itinerario" : "Itinerary"}
            </p>
            <p className="text-sm text-text-muted leading-relaxed font-light whitespace-pre-wrap">
              {renderWithLinks(itinerary)}
            </p>
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60 mb-2">
              {lang === "it" ? "Luoghi inclusi" : "Places included"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className="chip text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </ReadMoreModal>
    </CardShell>
  );
}

/* =========================================================
   DescFade — descrizione di esattamente 3 righe (4.875em = 3 × line-height 1.625)
   con sfumatura al posto del taglio, visibile solo se il testo è più lungo
   ========================================================= */
function DescFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    document.fonts?.ready.then(check);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className="relative text-xs sm:text-sm text-text-muted leading-relaxed font-light">
      <div ref={ref} className="h-[4.875em] overflow-hidden">
        {children}
      </div>
      {overflowing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.6em] bg-gradient-to-t from-white dark:from-[#2c241d] via-white/80 dark:via-[#2c241d]/80 to-transparent" />
      )}
    </div>
  );
}

/* =========================================================
   CardShell — layout condiviso (DB + fallback): stessa altezza sempre
   ========================================================= */
function CardShell({
  id,
  isHighlighted = false,
  cover,
  alt,
  placeTypeName,
  name,
  descNode,
  tags,
  durationLabel,
  lang,
  t,
  onMore,
  onBook,
  children,
}: {
  id?: string;
  isHighlighted?: boolean;
  cover: string;
  alt: string;
  placeTypeName: string;
  name: string;
  descNode: ReactNode;
  tags: string[];
  durationLabel: string | null;
  lang: Lang;
  t: TFn;
  onMore?: () => void;
  onBook: () => void;
  children?: ReactNode;
}) {
  const bookLabel = t("tours.btnBook", lang === "it" ? "Prenota" : "Book");

  return (
    <article
      id={id}
      className={cn(
        CARD_CLASS,
        "relative transition-all duration-700 ease-out",
        isHighlighted && [
          "ring-4 ring-[#9C1C1C] dark:ring-[#C4923A]",
          "border-[#9C1C1C] dark:border-[#C4923A]",
          "shadow-[0_0_22px_rgba(156,28,28,0.55),0_0_8px_rgba(156,28,28,0.75)] dark:shadow-[0_0_24px_rgba(196,146,58,0.65),0_0_8px_rgba(196,146,58,0.85)]",
          "z-20",
        ]
      )}
    >
      <div className="relative h-44 sm:h-56 bg-stone/30 overflow-hidden shrink-0">
        <Image
          src={optimizeImageUrl(cover, 720, 75)}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-transparent to-transparent pointer-events-none" />

        {/* Intestazione badge dell'immagine: flex-nowrap per tenerli rigorosamente sulla stessa riga */}
        <div className="absolute top-3 inset-x-3 sm:top-3.5 sm:inset-x-3.5 z-20 flex items-center justify-between gap-2 flex-nowrap pointer-events-none">
          {isHighlighted && (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm bg-[#9C1C1C] dark:bg-[#C4923A] text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider shadow-md border border-white/20 shrink-0 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" />
              <span>{lang === "it" ? "Scheda selezionata" : "Selected tour"}</span>
            </span>
          )}
          {placeTypeName && (
            <span
              title={placeTypeName}
              className={cn(
                "bg-bg-dark/80 backdrop-blur-md text-text-white text-[8.5px] sm:text-[9.5px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm border border-white/10 shrink min-w-0 truncate text-right",
                !isHighlighted && "ml-auto"
              )}
            >
              {placeTypeName}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col grow">
        {/* Titolo — altezza fissa */}
        <h3 className="font-serif text-lg sm:text-2xl font-bold text-text-main mb-1.5 sm:mb-2 leading-tight line-clamp-2 min-h-[2.6rem] sm:min-h-[3.75rem]">
          {name}
        </h3>

        {/* Descrizione — visibile per intero senza tagli */}
        <div className="text-xs sm:text-sm text-text-muted leading-relaxed font-light min-h-[4.5rem] sm:min-h-[5.25rem]">
          {descNode}
        </div>

        {/* Tag — spazio riservato per 3 righe, tutti visibili */}
        <div className="flex flex-wrap content-start gap-1.5 sm:gap-2 mt-3 sm:mt-4 mb-2.5 sm:mb-3 min-h-[6.75rem] sm:min-h-[7.5rem]">
          {tags.map((tag, i) => (
            <span key={i} className="chip text-[11px] sm:text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Spacer — spinge durata e pulsante sul fondo */}
        <div className="grow" />

        {/* Durata — ancorata al fondo, subito sopra il pulsante (spazio sempre riservato) */}
        <div className="mb-2.5 sm:mb-3 h-6">
          {durationLabel && (
            <span className="chip flex w-full items-center justify-center gap-1 font-semibold text-terracotta bg-terracotta/10 border-terracotta/20 text-[11px] sm:text-xs">
              <Clock className="w-3 h-3" />
              {durationLabel}
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={onBook}
            className="btn btn-primary btn-sm w-full justify-center whitespace-nowrap shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {bookLabel}
          </button>
        </div>
      </div>

      {/* Modale renderizzato nel <body> (portal) per evitare problemi di overflow/stacking */}
      {children}
    </article>
  );
}

/* =========================================================
   Fallback (se il DB non ha dati) — con modale come le card vere
   ========================================================= */
function FallbackTourCards({
  t,
  lang,
  highlightedId,
}: {
  t: TFn;
  lang: Lang;
  highlightedId?: string | null;
}) {
  const it = lang === "it";
  const cards = [
    {
      slug: "citta-arte",
      tag: it ? "Cultura & Storia" : "Culture & History",
      name: it ? "Città d'Arte (Veneto & Trentino)" : "Art Cities (Veneto & Trentino)",
      desc: it
        ? "Visite guidate nei centri storici più affascinanti: Venezia, Padova, Vicenza, Treviso, Verona, Trento, Rovereto, Bolzano, Merano e Bressanone."
        : "Guided walking tours in captivating historic centers: Venice, Padua, Vicenza, Treviso, Verona, Trent, Rovereto, Bolzano, Merano and Brixen.",
      tags: ["Venezia", "Padova", "Vicenza", "Verona", "Trento", "Bolzano"],
      img: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80",
    },
    {
      slug: "ville-castelli",
      tag: it ? "Architettura & Nobiltà" : "Architecture & Castles",
      name: it ? "Ville Venete & Castelli Trentini" : "Venetian Villas & Trentino Castles",
      desc: it
        ? "Un viaggio tra i capolavori di Andrea Palladio (La Rotonda, Villa Maser, Villa Emo, Villa Pisani, Riviera del Brenta) e i maestosi castelli del Trentino (Buonconsiglio, Castel Beseno, Thun)."
        : "A journey through Andrea Palladio's masterpieces and majestic Alpine castles.",
      tags: ["La Rotonda", "Villa Maser", "Villa Emo", "Buonconsiglio", "Castel Beseno", "Castel Thun"],
      img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    },
    {
      slug: "grande-guerra",
      tag: "1915 - 1918",
      name: it ? "La Grande Guerra 1915-1918" : "World War I (1915-1918)",
      desc: it
        ? "Itinerari storico-letterari sui forti, le trincee e i campi di battaglia degli Altipiani di Asiago, Lavarone e Luserna. Sacrario Militare e Musei storici."
        : "Historical-literary itineraries exploring forts, trenches and battlefields across Asiago, Lavarone and Luserna plateaus.",
      tags: ["Asiago", "Lavarone", "Luserna", "Sacrario Militare"],
      img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  return (
    <PlaceCardsCarousel lang={lang}>
      {cards.map((c) => (
        <FallbackCard
          key={c.slug}
          card={c}
          lang={lang}
          t={t}
          isHighlighted={highlightedId === c.slug}
        />
      ))}
    </PlaceCardsCarousel>
  );
}

function FallbackCard({
  card,
  lang,
  t,
  isHighlighted = false,
}: {
  card: { slug: string; tag: string; name: string; desc: string; tags: string[]; img: string };
  lang: Lang;
  t: TFn;
  isHighlighted?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <CardShell
      id={`tour-card-${card.slug}`}
      isHighlighted={isHighlighted}
      cover={card.img}
      alt={card.name}
      placeTypeName={card.tag}
      name={card.name}
      descNode={card.desc}
      tags={card.tags}
      durationLabel={null}
      lang={lang}
      t={t}
      onMore={() => setModalOpen(true)}
      onBook={() => triggerBookingPrefill({ tourTypeId: undefined, destination: card.name })}
    >
      <ReadMoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={card.name}
        body={card.desc}
        cover={card.img}
        badge={card.tag}
        closeLabel={lang === "it" ? "Chiudi" : "Close"}
        footer={
          <button
            type="button"
            onClick={() => {
              setModalOpen(false);
              triggerBookingPrefill({ tourTypeId: undefined, destination: card.name });
            }}
            className="btn btn-primary w-full justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {t("tours.btnBook", lang === "it" ? "Prenota" : "Book")}
          </button>
        }
      >
        {card.tags.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60 mb-2">
              {lang === "it" ? "Luoghi inclusi" : "Places included"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag, i) => (
                <span key={i} className="chip text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </ReadMoreModal>
    </CardShell>
  );
}