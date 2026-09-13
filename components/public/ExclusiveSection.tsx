"use client";

import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { stringValues } from "@/lib/live-edit/helpers";
import { tFieldStr } from "@/lib/utils";
import { renderWithLinks } from "@/lib/renderWithLinks";
import { triggerBookingPrefill } from "@/lib/bookingPrefill";
import { Moon, Calendar, Sparkles, Star, Lock, BookOpen, Users } from "lucide-react";
import Image from "next/image";
import MobileCarousel from "@/components/public/MobileCarousel";
import type { Database, Lang } from "@/types/database.types";

type PlaceT = Database["public"]["Tables"]["places"]["Row"] & {
  place_tour_types: {
    tour_type: {
      id: string;
      slug: string;
      name_it: string;
      name_en: string;
      color: string;
      is_exclusive: boolean;
    };
  }[];
};
type TourTypeT = Database["public"]["Tables"]["tour_types"]["Row"];

/**
 * Sezione Esperienze Esclusive — SFONDO TERRACOTTA
 */
export default function ExclusiveSection({
  places,
  tourTypes,
}: {
  places: PlaceT[];
  tourTypes: TourTypeT[];
}) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();

  const getTxt = (key: string, fallback: string) => {
    const val = t(key);
    return !val || val === key ? fallback : val;
  };

  const exclusivePlaces = places.filter((p) =>
    p.place_tour_types?.some((pt) => pt.tour_type.is_exclusive)
  );

  const displayCards = exclusivePlaces;

  const customTourFeatures = [
    {
      icon: Sparkles,
      titleKey: "customTour.feature1.title",
      titleDefault: "Itinerari privati e personalizzati",
      descKey: "customTour.feature1.desc",
      descDefault:
        "Costruiti su misura per voi: interessi, tempo a disposizione e livello di approfondimento decisi insieme.",
    },
    {
      icon: Lock,
      titleKey: "customTour.feature2.title",
      titleDefault: "Accesso a luoghi riservati",
      descKey: "customTour.feature2.desc",
      descDefault:
        "Aperture straordinarie, depositi museali e collezioni normalmente non visibili al pubblico, dove possibile organizzarle.",
    },
    {
      icon: BookOpen,
      titleKey: "customTour.feature3.title",
      titleDefault: "Lettura delle opere da storico dell'arte",
      descKey: "customTour.feature3.desc",
      descDefault:
        "Non solo date e nomi: il contesto, la tecnica e le storie che rendono un'opera comprensibile davvero.",
    },
    {
      icon: Users,
      titleKey: "customTour.feature4.title",
      titleDefault: "Famiglie, aziende e collezionisti",
      descKey: "customTour.feature4.desc",
      descDefault:
        "Su misura per piccoli gruppi privati, occasioni aziendali o incontri con collezioni e collezionisti.",
    },
  ];

  return (
    <section
      id="esperienze"
      className="section relative py-12 sm:py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--color-terracotta) 0%, var(--color-terracotta-dark) 100%)",
        color: "var(--text-white)",
      }}
    >
      {/* Decori luminosi di sfondo con tonalità Stone calde */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-24 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px]"
          style={{ backgroundColor: "var(--color-stone)", opacity: 0.15 }}
        />
        <div
          className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px]"
          style={{ backgroundColor: "var(--color-terracotta-dark)", opacity: 0.6 }}
        />
      </div>

      <div className="container-app relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header Sezione */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <Editable
            id="exclusive.subtitle"
            label="Sottotitolo (Esperienze Esclusive)"
            kind="string"
            stringKey="exclusive.subtitle"
            section="Esperienze Esclusive"
            values={stringValues(strings, "exclusive.subtitle", "Visite Speciali")}
          >
            <span
              className="eyebrow-dark mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest font-medium border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: "rgba(222, 197, 165, 0.3)",
                color: "var(--color-stone)",
              }}
            >
              <EditableIcon
                id="exclusive.subtitle.icon"
                iconName={strings["exclusive.subtitle.icon"]?.it || "Sparkles"}
                stringKey="exclusive.subtitle.icon"
                label="Icona Badge Esperienze Esclusive"
                iconProps={{ className: "w-3.5 h-3.5", style: { color: "var(--color-stone)" } }}
              />
              <span>{getTxt("exclusive.subtitle", "Visite Speciali")}</span>
            </span>
          </Editable>

          <Editable
            id="exclusive.title"
            label="Titolo Principale (Esperienze Esclusive)"
            kind="string"
            stringKey="exclusive.title"
            section="Esperienze Esclusive"
            values={stringValues(strings, "exclusive.title", "Esperienze Esclusive")}
            as="block"
          >
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight break-words"
              style={{ color: "var(--text-white)" }}
            >
              {getTxt("exclusive.title", "Esperienze Esclusive")}
            </h2>
          </Editable>

          <Editable
            id="exclusive.desc"
            label="Descrizione (Esperienze Esclusive)"
            kind="string"
            stringKey="exclusive.desc"
            section="Esperienze Esclusive"
            values={stringValues(
              strings,
              "exclusive.desc",
              "Itinerari evocativi fuori dagli orari di afflusso di massa, disegnati per chi desidera assaporare l'arte e il paesaggio con la giusta calma ed eleganza."
            )}
            as="block"
          >
            <p
              className="text-sm sm:text-lg font-light leading-relaxed max-w-2xl mx-auto break-words"
              style={{ color: "rgba(247, 240, 227, 0.85)" }}
            >
              {getTxt(
                "exclusive.desc",
                "Itinerari evocativi fuori dagli orari di afflusso di massa, disegnati per chi desidera assaporare l'arte e il paesaggio con la giusta calma ed eleganza."
              )}
            </p>
          </Editable>

          <div className="flex items-center justify-center gap-3 my-4 sm:my-6">
            <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.3)" }} />
            <EditableIcon
              id="exclusive.divider.icon"
              iconName={strings["exclusive.divider.icon"]?.it || "Star"}
              stringKey="exclusive.divider.icon"
              label="Icona Divisore (Esperienze Esclusive)"
              iconProps={{ className: "w-4 h-4", style: { color: "var(--color-stone)", fill: "rgba(222, 197, 165, 0.3)" } }}
            />
            <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.3)" }} />
          </div>
        </div>

        {/* Sezione Tour su Misura */}
        <div className="mt-10 sm:mt-16">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-10 lg:p-12 backdrop-blur-md shadow-2xl"
            style={{
              backgroundColor: "rgba(36, 26, 18, 0.45)",
              borderColor: "rgba(222, 197, 165, 0.2)",
            }}
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">

              {/* Colonna SX: Info e Call to Action */}
              <div className="lg:col-span-6 flex flex-col justify-between h-full">
                <div>
                  <Editable
                    id="customTour.eyebrow"
                    label="Sopratitolo (Tour su Misura)"
                    kind="string"
                    stringKey="customTour.eyebrow"
                    section="Esperienze Esclusive"
                    values={stringValues(strings, "customTour.eyebrow", "Tour su Misura")}
                  >
                    <span
                      className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1.5 sm:mb-3"
                      style={{ color: "var(--color-stone)" }}
                    >
                      <span className="w-4 sm:w-6 h-px" style={{ backgroundColor: "var(--color-stone)" }} />
                      <span>{getTxt("customTour.eyebrow", "Tour su Misura")}</span>
                    </span>
                  </Editable>

                  <Editable
                    id="customTour.title"
                    label="Titolo (Tour su Misura)"
                    kind="string"
                    stringKey="customTour.title"
                    section="Esperienze Esclusive"
                    values={stringValues(
                      strings,
                      "customTour.title",
                      "Un percorso scritto con voi, raccontato con occhi da storico dell'arte"
                    )}
                    as="block"
                    className="w-full min-w-0"
                  >
                    <h3
                      className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight break-words"
                      style={{ color: "var(--text-white)" }}
                    >
                      {getTxt("customTour.title", "Un percorso scritto con voi, raccontato con occhi da storico dell'arte")}
                    </h3>
                  </Editable>

                  <Editable
                    id="customTour.desc"
                    label="Descrizione (Tour su Misura)"
                    kind="string"
                    stringKey="customTour.desc"
                    section="Esperienze Esclusive"
                    values={stringValues(
                      strings,
                      "customTour.desc",
                      "Per chi desidera qualcosa di più di un itinerario standard: percorsi privati costruiti sui vostri interessi, con accesso a luoghi normalmente chiusi al pubblico e la lettura delle opere raccontata con la formazione di uno storico dell'arte."
                    )}
                    as="block"
                    className="w-full min-w-0"
                  >
                    <p
                      className="text-xs sm:text-base font-light leading-relaxed mb-3 sm:mb-6 break-words"
                      style={{ color: "rgba(247, 240, 227, 0.8)" }}
                    >
                      {getTxt(
                        "customTour.desc",
                        "Per chi desidera qualcosa di più di un itinerario standard: percorsi privati costruiti sui vostri interessi, con accesso a luoghi normalmente chiusi al pubblico e la lettura delle opere raccontata con la formazione di uno storico dell'arte."
                      )}
                    </p>
                  </Editable>

                  {/* Citazione */}
                  <div
                    className="mb-4 sm:mb-8 pl-3 sm:pl-4 border-l-2"
                    style={{ borderColor: "var(--color-stone)" }}
                  >
                    <Editable
                      id="customTour.quote"
                      label="Nota (Tour su Misura)"
                      kind="string"
                      stringKey="customTour.quote"
                      section="Esperienze Esclusive"
                      values={stringValues(
                        strings,
                        "customTour.quote",
                        "Un progetto, uno storico dell'arte: ogni tour esclusivo nasce da un colloquio con voi, per costruire l'itinerario più adatto."
                      )}
                      as="block"
                      className="w-full min-w-0"
                    >
                      <blockquote
                        className="text-[11px] sm:text-sm italic font-light break-words"
                        style={{ color: "rgba(247, 240, 227, 0.7)" }}
                      >
                        {getTxt(
                          "customTour.quote",
                          "Un progetto, uno storico dell'arte: ogni tour esclusivo nasce da un colloquio con voi, per costruire l'itinerario più adatto."
                        )}
                      </blockquote>
                    </Editable>
                  </div>
                </div>

                {/* Bottone e Note */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  <button
                    onClick={() =>
                      triggerBookingPrefill({
                        destination: lang === "it" ? "Tour su misura" : "Custom tour",
                      })
                    }
                    className="text-xs sm:text-sm px-5 py-3 sm:py-3.5 rounded-lg font-semibold shadow-lg transition-all duration-300 shrink-0 w-full sm:w-auto text-center whitespace-nowrap hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      color: "var(--color-terracotta)",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    <Editable
                      id="customTour.cta"
                      label="Testo Bottone (Tour su Misura)"
                      kind="string"
                      stringKey="customTour.cta"
                      section="Esperienze Esclusive"
                      values={stringValues(strings, "customTour.cta", "Richiedi un tour su misura")}
                    >
                      <span>{getTxt("customTour.cta", "Richiedi un tour su misura")}</span>
                    </Editable>
                  </button>

                  <Editable
                    id="customTour.note"
                    label="Nota sotto CTA (Tour su Misura)"
                    kind="string"
                    stringKey="customTour.note"
                    section="Esperienze Esclusive"
                    values={stringValues(
                      strings,
                      "customTour.note",
                      "Su prenotazione · disponibilità limitata · prezzo su richiesta"
                    )}
                  >
                    <p
                      className="text-[10px] sm:text-xs text-center sm:text-left break-words"
                      style={{ color: "rgba(247, 240, 227, 0.5)" }}
                    >
                      {getTxt("customTour.note", "Su prenotazione · disponibilità limitata · prezzo su richiesta")}
                    </p>
                  </Editable>
                </div>
              </div>

              {/* Colonna DX: Feature Grid 2x2 Affiancate anche su Mobile */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-4 min-w-0">
                {customTourFeatures.map((f, i) => {
                  const Icon = f.icon;
                  const title = getTxt(f.titleKey, f.titleDefault);
                  const desc = getTxt(f.descKey, f.descDefault);

                  return (
                    <div
                      key={i}
                      className="rounded-xl border p-3 sm:p-5 transition-all duration-300 hover:border-stone-300/40 min-w-0 overflow-hidden flex flex-col justify-start"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.18)",
                        borderColor: "rgba(222, 197, 165, 0.15)",
                      }}
                    >
                      <div
                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 shrink-0 border"
                        style={{
                          backgroundColor: "rgba(222, 197, 165, 0.1)",
                          borderColor: "rgba(222, 197, 165, 0.25)",
                          color: "var(--color-stone)",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Editable
                          id={f.titleKey}
                          label={`Titolo Caratteristica ${i + 1} (Tour su Misura)`}
                          kind="string"
                          stringKey={f.titleKey}
                          section="Esperienze Esclusive"
                          values={stringValues(strings, f.titleKey, f.titleDefault)}
                          as="block"
                          className="w-full min-w-0"
                        >
                          <h4
                            className="font-serif text-xs sm:text-base font-bold mb-1 sm:mb-2 leading-tight break-words"
                            style={{ color: "var(--text-white)" }}
                          >
                            {title}
                          </h4>
                        </Editable>

                        <Editable
                          id={f.descKey}
                          label={`Descrizione Caratteristica ${i + 1} (Tour su Misura)`}
                          kind="string"
                          stringKey={f.descKey}
                          section="Esperienze Esclusive"
                          values={stringValues(strings, f.descKey, f.descDefault)}
                          as="block"
                          className="w-full min-w-0"
                        >
                          <p
                            className="text-[10px] sm:text-xs leading-tight sm:leading-relaxed font-light break-words"
                            style={{ color: "rgba(247, 240, 227, 0.7)" }}
                          >
                            {desc}
                          </p>
                        </Editable>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* Grid / Carousel Card Centrato */}
        {displayCards.length > 0 && (
          <LiveEditSectionMask
            adminHref="/admin/places"
            adminLabel="Luoghi"
            hint="Esperienze esclusive: associa la categoria 'Esclusiva' al luogo in Luoghi."
            minHeight="min-h-[360px]"
          >
            <div className="mt-10 sm:mt-16">
              <MobileCarousel
                hint={lang === "it" ? "← Scorri per vedere tutte le esperienze →" : "← Swipe to see all experiences →"}
                hintClassName="text-center text-xs opacity-60 mb-2"
                desktopMode={displayCards.length > 3 ? "scroll" : "grid"}
              >
                {displayCards.map((c) => (
                  <div key={c.id} className="w-full max-w-sm sm:max-w-md mx-auto">
                    <ExclusiveCard place={c} lang={lang} t={t} />
                  </div>
                ))}
              </MobileCarousel>
            </div>
          </LiveEditSectionMask>
        )}

      </div>
    </section>
  );
}

/* === Card Esperienza da Luogo === */
function ExclusiveCard({
  place,
  lang,
  t,
}: {
  place: PlaceT;
  lang: Lang;
  t: (k: string, f?: string) => string;
}) {
  const cover =
    place.cover_image_url ??
    "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80";

  return (
    <article
      className="border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-xl h-full group min-w-0"
      style={{
        backgroundColor: "rgba(36, 26, 18, 0.5)",
        borderColor: "rgba(222, 197, 165, 0.2)",
      }}
    >
      <div className="relative h-48 sm:h-60 overflow-hidden shrink-0">
        <Image
          src={cover}
          alt={tFieldStr(place as any, "name", lang)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--color-terracotta-dark) 0%, rgba(77,26,16,0.3) 60%, transparent 100%)",
          }}
        />
        <span
          className="absolute top-4 left-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-md border"
          style={{
            backgroundColor: "var(--bg-main)",
            color: "var(--color-terracotta-dark)",
            borderColor: "var(--color-stone)",
          }}
        >
          <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "var(--color-terracotta)" }} />
          {lang === "it" ? "Esperienza Esclusiva" : "Exclusive"}
        </span>
      </div>
      <div className="p-4 sm:p-6 flex flex-col grow justify-between min-w-0">
        <div>
          <h3
            className="font-serif text-lg sm:text-2xl font-bold mb-1.5 sm:mb-2 leading-snug break-words"
            style={{ color: "var(--text-white)" }}
          >
            {tFieldStr(place as any, "name", lang)}
          </h3>
          <p
            className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 font-light line-clamp-3 break-words"
            style={{ color: "rgba(247, 240, 227, 0.75)" }}
          >
            {renderWithLinks(tFieldStr(place as any, "short_description", lang))}
          </p>
        </div>
        <button
          onClick={() =>
            triggerBookingPrefill({
              tourTypeId: place.place_tour_types?.find((pt) => pt.tour_type.is_exclusive)?.tour_type.id,
              destination: tFieldStr(place as any, "name", lang),
            })
          }
          className="w-full text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5"
          style={{
            backgroundColor: "var(--bg-main)",
            color: "var(--color-terracotta)",
          }}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          {t("exclusive.btn")}
        </button>
      </div>
    </article>
  );
}