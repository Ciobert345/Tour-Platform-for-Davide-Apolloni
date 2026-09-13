"use client";

import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import { Children, type ReactNode } from "react";
import { tFieldStr, tArrField } from "@/lib/utils";
import { renderWithLinks } from "@/lib/renderWithLinks";
import { triggerBookingPrefill } from "@/lib/bookingPrefill";
import { MapPin, Clock, Info, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import MobileCarousel from "@/components/public/MobileCarousel";
import type { Database, Lang } from "@/types/database.types";

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

const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
];

/**
 * Tours section
 * - Mostra i "place card" (luoghi) raggruppati per tour type
 * - Filtra fuori i luoghi delle "esperienze esclusive" (mostrati nella sezione apposita)
 */
export default function ToursSection({
  places,
  tourTypes,
}: {
  places: PlaceT[];
  tourTypes: TourTypeT[];
}) {
  const t = useT();
  const { lang } = useLang();

  // Tour types standard
  const standardTT = tourTypes.filter(
    (tt) => !tt.is_exclusive && !tt.is_custom_tour
  );

  return (
    <section id="tour" className="section bg-bg-main">
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
          adminHref="/admin/places"
          adminLabel="Luoghi"
          hint="Card dei luoghi e itinerari. Le categorie tour si gestiscono in Categorie Tour."
          minHeight="min-h-[420px]"
        >
          {places.length === 0 ? (
            <FallbackTourCards t={t} lang={lang} />
          ) : standardTT.length === 0 ? (
            <PlaceCardsCarousel lang={lang}>
              {places.map((p, idx) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  lang={lang}
                  t={t}
                  fallbackIdx={idx}
                />
              ))}
            </PlaceCardsCarousel>
          ) : (
            standardTT.map((tt) => {
              const ttPlaces = places
                .filter((p) =>
                  p.place_tour_types?.some((pt) => pt.tour_type.id === tt.id)
                )
                .slice(0, 6);
              const displayPlaces = ttPlaces.length > 0 ? ttPlaces : places.slice(0, 3);

              return (
                <div key={tt.id} id={`tour-${tt.slug}`} className="mb-12 sm:mb-16 last:mb-0">
                  <div className="flex items-center gap-3 sm:gap-3.5 mb-6 sm:mb-8">
                    <div
                      className="w-1.5 h-8 sm:h-10 rounded-full"
                      style={{ backgroundColor: tt.color || "#9C1C1C" }}
                    />
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-text-main">
                        {tFieldStr(tt as any, "name", lang)}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5 font-light">
                        {tFieldStr(tt as any, "description", lang)}
                      </p>
                    </div>
                  </div>
                  <PlaceCardsCarousel lang={lang}>
                    {displayPlaces.map((p, idx) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        lang={lang}
                        t={t}
                        ttColor={tt.color}
                        ttTag={tFieldStr(tt as any, "name", lang)}
                        ttId={tt.id}
                        fallbackIdx={idx}
                      />
                    ))}
                  </PlaceCardsCarousel>
                </div>
              );
            })
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
function PlaceCard({
  place,
  lang,
  t,
  ttColor,
  ttTag,
  ttId,
  fallbackIdx = 0,
}: {
  place: PlaceT;
  lang: Lang;
  t: (k: string, f?: string) => string;
  ttColor?: string;
  ttTag?: string;
  ttId?: string;
  fallbackIdx?: number;
}) {
  const rawCover = place.cover_image_url?.trim();
  const cover = (rawCover && rawCover.length > 0)
    ? rawCover
    : DEFAULT_COVERS[fallbackIdx % DEFAULT_COVERS.length];

  const tags = tArrField(place as any, "tags", lang);
  const placeTypeName = tFieldStr((place.place_type ?? {}) as any, "name", lang);
  const duration = place.duration_hours
    ? `${place.duration_hours} ${lang === "it" ? "ore" : "hours"}`
    : null;

  return (
    <article className="card-base card-hover flex flex-col bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden h-full">
      <div className="relative h-44 sm:h-56 bg-stone/30 overflow-hidden">
        <Image
          src={cover}
          alt={tFieldStr(place as any, "name", lang) || "Itinerario"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          className="object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-transparent to-transparent pointer-events-none" />
        {ttTag && (
          <span
            className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-sm text-text-white backdrop-blur-md shadow-xs z-10"
            style={{ backgroundColor: (ttColor ?? "#9C1C1C") + "F0" }}
          >
            {ttTag}
          </span>
        )}
        {placeTypeName && (
          <span className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 bg-bg-dark/80 backdrop-blur-md text-text-white text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm border border-white/10 z-10">
            {placeTypeName}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-6 flex flex-col grow">
        <h3 className="font-serif text-lg sm:text-2xl font-bold text-text-main mb-1.5 sm:mb-2 leading-tight line-clamp-2 min-h-0 sm:min-h-[3.25rem]">
          {tFieldStr(place as any, "name", lang)}
        </h3>

        <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-3 sm:mb-5 grow line-clamp-3 min-h-0 sm:min-h-[4.5rem] font-light">
          {renderWithLinks(tFieldStr(place as any, "short_description", lang))}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 pb-2.5 sm:pb-3 border-b border-black/5">
            {tags.slice(0, 12).map((tag, i) => (
              <span key={i} className="chip text-[11px] sm:text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {duration && (
          <div className="mb-2.5 sm:mb-3.5">
            <span className="chip inline-flex items-center gap-1 font-semibold text-terracotta bg-terracotta/10 border-terracotta/20 text-[11px] sm:text-xs">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          </div>
        )}



        <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-auto pt-2 border-t border-black/5">
          <button
            onClick={() =>
              triggerBookingPrefill({
                tourTypeId: ttId ?? place.place_tour_types?.[0]?.tour_type?.id,
                destination: tFieldStr(place as any, "name", lang),
              })
            }
            className="btn btn-secondary btn-sm grow basis-[45%] min-w-fit whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            {t("tours.btnMore")}
          </button>
          <button
            onClick={() =>
              triggerBookingPrefill({
                tourTypeId: ttId ?? place.place_tour_types?.[0]?.tour_type?.id,
                destination: tFieldStr(place as any, "name", lang),
              })
            }
            className="btn btn-primary btn-sm grow basis-[45%] min-w-fit whitespace-nowrap shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {t("tours.btnBook")}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   Fallback (se DB non ha dati)
   ========================================================= */
function FallbackTourCards({
  t,
  lang,
  simple,
}: {
  t: (k: string, f?: string) => string;
  lang: Lang;
  simple?: boolean;
}) {
  const cards = [
    {
      slug: "citta-arte",
      tag: lang === "it" ? "Cultura & Storia" : "Culture & History",
      name: lang === "it" ? "Città d'Arte (Veneto & Trentino)" : "Art Cities (Veneto & Trentino)",
      desc:
        lang === "it"
          ? "Visite guidate nei centri storici più affascinanti: Venezia, Padova, Vicenza, Treviso, Verona, Trento, Rovereto, Bolzano, Merano e Bressanone."
          : "Guided walking tours in captivating historic centers: Venice, Padua, Vicenza, Treviso, Verona, Trent, Rovereto, Bolzano, Merano and Brixen.",
      img: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80",
      color: "#3D6E90",
    },
    {
      slug: "ville-castelli",
      tag: lang === "it" ? "Architettura & Nobiltà" : "Architecture & Castles",
      name:
        lang === "it"
          ? "Ville Venete & Castelli Trentini"
          : "Venetian Villas & Trentino Castles",
      desc:
        lang === "it"
          ? "Un viaggio tra i capolavori di Andrea Palladio (La Rotonda, Villa Maser, Villa Emo, Villa Pisani, Riviera del Brenta) e i maestosi castelli del Trentino (Buonconsiglio, Castel Beseno, Thun)."
          : "A journey through Andrea Palladio's masterpieces and majestic Alpine castles.",
      img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
      color: "#4A6535",
    },
    {
      slug: "grande-guerra",
      tag: "1915 - 1918",
      name:
        lang === "it"
          ? "La Grande Guerra 1915-1918"
          : "World War I (1915-1918)",
      desc:
        lang === "it"
          ? "Itinerari storico-letterari sui forti, le trincee e i campi di battaglia degli Altipiani di Asiago, Lavarone e Luserna. Sacrario Militare e Musei storici."
          : "Historical-literary itineraries exploring forts, trenches and battlefields across Asiago, Lavarone and Luserna plateaus.",
      img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      color: "#9C1C1C",
    },
  ];

  if (simple) {
    return (
      <div className="text-center py-10 text-text-muted">
        <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40 text-terracotta" />
        <p className="font-light">{lang === "it" ? "Percorsi in aggiornamento..." : "Itineraries coming soon..."}</p>
      </div>
    );
  }

  return (
    <PlaceCardsCarousel lang={lang}>
      {cards.map((c) => (
        <article key={c.slug} className="card-base card-hover flex flex-col bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden h-full">
          <div className="relative h-56 bg-stone/30 overflow-hidden">
            <Image
              src={c.img}
              alt={c.name}
              fill
              sizes="(max-width: 768px) 86vw, 33vw"
              className="object-cover transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-transparent to-transparent pointer-events-none" />
            <span
              className="absolute top-3.5 left-3.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm text-text-white backdrop-blur-md shadow-xs z-10"
              style={{ backgroundColor: c.color + "F0" }}
            >
              {c.tag}
            </span>
          </div>
          <div className="p-6 flex flex-col grow">
            <h3 className="font-serif text-2xl font-bold text-text-main mb-2 leading-tight line-clamp-2 min-h-[3.25rem]">
              {c.name}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed mb-5 line-clamp-3 min-h-[4.5rem] font-light">
              {c.desc}
            </p>
            <div className="flex gap-2.5 mt-auto pt-2 border-t border-black/5">
              <a href="#prenota" className="btn btn-secondary btn-sm grow">
                <Info className="w-3.5 h-3.5" />
                {t("tours.btnMore")}
              </a>
              <a href="#prenota" className="btn btn-primary btn-sm grow shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
                {t("tours.btnBook")}
              </a>
            </div>
          </div>
        </article>
      ))}
    </PlaceCardsCarousel>
  );
}