"use client";

import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import { cn, tFieldStr, formatDate } from "@/lib/utils";
import { renderWithLinks } from "@/lib/renderWithLinks";
import { triggerBookingPrefill } from "@/lib/bookingPrefill";
import { CalendarDays, Users, MapPin, Sparkles, Flame, CircleDollarSign } from "lucide-react";
import Image from "next/image";
import MobileCarousel from "@/components/public/MobileCarousel";
import type { Database, Lang } from "@/types/database.types";

type EventT = Database["public"]["Tables"]["events"]["Row"] & {
  tour_type: { id: string; slug: string; name_it: string; name_en: string; color: string; icon: string | null } | null;
  event_places: { place: { id: string; slug: string; name_it: string; name_en: string; cover_image_url: string | null } }[];
};

/**
 * Events / Prossime partenze — sezione con sfondo alternato
 * Su mobile: carosello orizzontale con scroll-snap
 * Su tablet/desktop: griglia responsive (o scroll orizzontale se > 3 eventi)
 */
export default function EventsSection({ events }: { events: EventT[] }) {
  const t = useT();
  const { lang } = useLang();

  return (
    <section id="prossime-visite" className="section bg-bg-alt/50 border-b border-black/5">
      <div className="container-app">
        <EditableSectionHeading
          section="Eventi"
          subtitleKey="events.subtitle"
          titleKey="events.title"
          descKey="events.desc"
        />
        <div className="section-divider">
          <span className="w-12 h-px bg-gold/50" />
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="w-12 h-px bg-gold/50" />
        </div>

        <LiveEditSectionMask
          adminHref="/admin/events"
          adminLabel="Eventi / Calendario"
          hint="Date, titoli, posti disponibili e luoghi collegati agli eventi."
          minHeight="min-h-[360px]"
        >
          <div id="grande-guerra">
            {events.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-muted border border-dashed border-black/15 rounded-md bg-white">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30 text-terracotta" />
                <p className="font-light">{t("events.empty")}</p>
              </div>
            ) : (
              <MobileCarousel
                hint={lang === "it" ? "← Scorri per vedere tutti gli eventi →" : "← Swipe to see all events →"}
                desktopMode={events.length > 3 ? "scroll" : "grid"}
              >
                {events.map((e) => (
                  <EventCard key={e.id} event={e} lang={lang} t={t} />
                ))}
              </MobileCarousel>
            )}
          </div>
        </LiveEditSectionMask>
      </div>
    </section>
  );
}

function EventCard({
  event,
  lang,
  t,
}: {
  event: EventT;
  lang: Lang;
  t: (k: string, f?: string) => string;
}) {
  const cover =
    event.cover_image_url ??
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80";

  const badgeMap: Record<string, { label: string; label_en: string; cls: string; Icon: typeof Sparkles }> = {
    open: {
      label: t("events.badgeOpen"),
      label_en: "Open",
      cls: "bg-blue-adriatic",
      Icon: CircleDollarSign,
    },
    last_places: {
      label: t("events.badgeLast"),
      label_en: "Last spots",
      cls: "bg-terracotta",
      Icon: Flame,
    },
    full: { label: "Completo", label_en: "Full", cls: "bg-bg-dark", Icon: Users },
    closed: { label: "Chiuso", label_en: "Closed", cls: "bg-text-light", Icon: Users },
  };
  const badge = badgeMap[event.status] ?? badgeMap.open;
  const seatsLeft =
    typeof event.total_seats === "number" && typeof event.booked_seats === "number"
      ? Math.max(0, event.total_seats - event.booked_seats)
      : null;

  return (
    <article className="card-base card-hover flex flex-col bg-white h-full">
      <div className="relative h-44 sm:h-52 overflow-hidden">
        <Image
          src={cover}
          alt={tFieldStr(event as any, "title", lang)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-transparent to-transparent" />
        <span
          className={cn(
            "absolute top-3 left-3 sm:top-4 sm:left-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-sm text-text-white flex items-center gap-1.5 shadow-xs backdrop-blur-md"
          )}
          style={{ backgroundColor: (event.tour_type?.color ?? "#9C1C1C") + "EE" }}
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {lang === "it" ? badge.label : badge.label_en}
        </span>
        {seatsLeft !== null && seatsLeft <= 3 && event.status === "last_places" && (
          <span className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm bg-terracotta text-text-white shadow-xs">
            {seatsLeft} {lang === "it" ? "posti rimasti" : "spots left"}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-6 flex flex-col grow">
        {/* Data */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-terracotta mb-2">
          <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-terracotta" />
          <span>
            {formatDate(event.start_date, lang)}
            {event.end_date && `  →  ${formatDate(event.end_date, lang)}`}
          </span>
        </div>

        <h3 className="font-serif text-lg sm:text-2xl font-bold text-text-main mb-2 leading-tight line-clamp-2 min-h-0 sm:min-h-[3rem]">
          {tFieldStr(event as any, "title", lang)}
        </h3>

        {(event.tour_type || event.event_places?.[0]?.place) && (
          <div className="flex flex-wrap gap-2 mb-2.5 sm:mb-3 pb-2.5 sm:pb-3 border-b border-black/5">
            {event.tour_type && (
              <span
                className="chip font-semibold"
                style={{
                  backgroundColor: (event.tour_type.color ?? "#9C1C1C") + "15",
                  color: event.tour_type.color,
                }}
              >
                {tFieldStr(event.tour_type as any, "name", lang)}
              </span>
            )}
            {event.event_places?.[0]?.place && (
              <span className="chip inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tFieldStr(event.event_places[0].place as any, "name", lang)}
              </span>
            )}
          </div>
        )}

        {typeof event.total_seats === "number" && (
          <div className="mb-3 sm:mb-4">
            <span className="chip inline-flex items-center gap-1 font-semibold text-terracotta bg-terracotta/10 border-terracotta/20">
              <Users className="w-3 h-3" />
              {event.total_seats} {lang === "it" ? "posti" : "seats"}
            </span>
          </div>
        )}

        <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-3.5 sm:mb-5 line-clamp-3 min-h-0 sm:min-h-[4.5rem] grow font-light">
          {renderWithLinks(tFieldStr(event as any, "description", lang))}
        </p>

        <button
          onClick={() =>
            triggerBookingPrefill({
              tourTypeId: event.tour_type?.id ?? undefined,
              preferredDate: event.start_date ?? undefined,
              destination: tFieldStr(event as any, "title", lang),
            })
          }
          className="btn btn-primary w-full mt-auto shadow-xs whitespace-nowrap"
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          {t("events.btnBook")}
        </button>
      </div>
    </article>
  );
}