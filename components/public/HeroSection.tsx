"use client";

import React, { useState } from "react";
import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import { tFieldStr, cn } from "@/lib/utils";
import { renderUiRichText, stripHtmlTags, applyUiVars } from "@/lib/rich-text";
import Editable from "@/components/live-edit/Editable";
import HeroBackground from "@/components/public/HeroBackground";
import EditableBanner, { type BannerData } from "@/components/live-edit/EditableBanner";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { renderIconByName } from "@/lib/icons";
import { useLiveEdit } from "@/components/live-edit/LiveEditProvider";
import type { Database } from "@/types/database.types";
import { stringValues, imageValue } from "@/lib/live-edit/helpers";
import { Calendar, Compass, ImageIcon } from "lucide-react";
import supabase from "@/lib/supabase/browser";
import Image from "next/image";
import HoverRevealLogo from "@/components/public/HoverRevealLogo";

type ProfileT = Database["public"]["Tables"]["profiles"]["Row"] & {
  contacts?: Database["public"]["Tables"]["contacts"]["Row"][];
  credentials?: Database["public"]["Tables"]["credentials"]["Row"][];
};

/** Parse the list of active banner IDs from the ui_strings map */
function parseBanners(strings: Record<string, { it: string; en: string }>): BannerData[] {
  const listStr = strings["banner.list"]?.it ?? "1,2";
  const ids = listStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.map((id) => ({
    id,
    text_it: strings[`banner.${id}.text`]?.it ?? "",
    text_en: strings[`banner.${id}.text`]?.en ?? "",
    icon: strings[`banner.${id}.icon`]?.it ?? "GraduationCap",
    style: (strings[`banner.${id}.style`]?.it as BannerData["style"]) ?? "neutral",
  }));
}

const HIGHLIGHT_DEFAULTS = [
  { key: "hero.feat1", iconKey: "hero.feat1.icon", defaultIcon: "Landmark", color: "text-terracotta" },
  { key: "hero.feat2", iconKey: "hero.feat2.icon", defaultIcon: "Castle", color: "text-olive-dark" },
  { key: "hero.feat3", iconKey: "hero.feat3.icon", defaultIcon: "Mountain", color: "text-terracotta-dark" },
  { key: "hero.feat4", iconKey: "hero.feat4.icon", defaultIcon: "Bike", color: "text-blue-adriatic" },
];

function EditableHighlight({
  h,
  strings,
}: {
  h: typeof HIGHLIGHT_DEFAULTS[0];
  strings: Record<string, { it: string; en: string }>;
}) {
  const t = useT();
  const localIcon = strings[h.iconKey]?.it || h.defaultIcon;

  return (
    <div className="flex items-center sm:items-start gap-2 sm:gap-3 text-xs sm:text-sm text-text-main bg-white/80 backdrop-blur-md border border-black/[0.04] rounded-2xl p-2 xs:p-2.5 sm:p-3.5 hover:bg-white hover:border-terracotta/30 hover:shadow-md transition-all duration-300 relative z-1 min-w-0">
      <div className="relative shrink-0 sm:mt-0.5">
        <EditableIcon
          id={`hero.highlight.${h.key}.icon`}
          iconName={localIcon}
          stringKey={h.iconKey}
          label={`Icona ${t(h.key)}`}
          className="p-0 leading-none"
          iconProps={{ className: cn("w-4 h-4 sm:w-5 sm:h-5", h.color) }}
        />
      </div>
      <Editable
        id={h.key}
        label={`Highlight: ${h.key}`}
        kind="string"
        stringKey={h.key}
        section="Hero"
        values={stringValues(strings, h.key)}
        className="min-w-0 flex-1"
      >
        <span className="font-semibold text-text-main leading-snug line-clamp-2 sm:line-clamp-none text-[11px] xs:text-xs sm:text-sm">{t(h.key)}</span>
      </Editable>
    </div>
  );
}

export default function HeroSection({ profile }: { profile: ProfileT | null }) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();
  const liveEdit = useLiveEdit();
  const years = profile?.experience_years ?? 20;

  const banners = parseBanners(strings);

  const logosSwapped = strings["hero.logos_swapped"]?.it === "true";

  const name = `${tFieldStr(profile ?? {}, "first_name", lang)} ${tFieldStr(
    profile ?? {},
    "last_name",
    lang
  )}`.trim();

  const heroTitleRaw = t("hero.title");
  const heroTitleNode = renderUiRichText(heroTitleRaw, {
    name: name || "Davide Apolloni",
  });
  const heroTitlePlain = stripHtmlTags(applyUiVars(heroTitleRaw, { name: name || "Davide Apolloni" }));

  const photo =
    profile?.photo_url ??
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] pt-[105px] sm:pt-[115px] pb-12 sm:pb-16 md:pt-[130px] md:pb-24 flex items-center overflow-hidden"
    >
      <HeroBackground />

      {/* Floating Hero Background Edit Button for Live Edit */}
      {liveEdit?.enabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            liveEdit.select(
              {
                id: "hero.bg_image",
                label: "Immagine di sfondo Hero (URL / File)",
                kind: "image",
                stringKey: "hero.bg_image",
                section: "Hero",
              },
              stringValues(strings, "hero.bg_image")
            );
          }}
          className="absolute top-28 right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-bg-dark/90 text-text-white text-xs font-semibold hover:bg-terracotta transition-all shadow-xl border border-white/20 cursor-pointer backdrop-blur"
        >
          <ImageIcon className="w-3.5 h-3.5 text-terracotta" />
          <span>Modifica Sfondo Hero</span>
        </button>
      )}

      {/* ===== CONTENT ===== */}
      <div className="container-app relative z-10 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* SINISTRA: Banners (order-1 mobile), Titolo, highlights e CTA (order-3 mobile) */}
          <div className="contents lg:flex lg:flex-col lg:col-span-7 lg:justify-center lg:order-1 max-w-[720px]">
            {banners.length > 0 && (
              <div className="order-1 lg:order-none mb-3 sm:mb-4 lg:mb-5 flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-2.5 w-full">
                {banners.map((banner) => (
                  <EditableBanner key={banner.id} banner={banner} lang={lang} />
                ))}
              </div>
            )}

            {/* BLOCCO TESTO, HIGHLIGHTS E CTA (su mobile dopo il logo) */}
            <div className="order-3 lg:order-none flex flex-col w-full">
              {/* TITOLO PRINCIPALE */}
              <Editable
                id="hero.title"
                label="Titolo hero"
                kind="string"
                stringKey="hero.title"
                section="Hero"
                values={stringValues(strings, "hero.title")}
                as="block"
              >
                <h1 className="font-serif text-[1.8rem] xs:text-[2.1rem] sm:text-[2.75rem] lg:text-[3.9rem] xl:text-[4.2rem] font-bold leading-[1.1] sm:leading-[1.08] tracking-tight mb-4 sm:mb-6 text-text-main text-balance break-words animate-fade-in-up">
                  {heroTitlePlain ? (
                    heroTitleNode
                  ) : (
                    <>
                      Scopri Veneto &amp; Trentino attraverso{" "}
                      <span className="text-terracotta italic font-normal">l'Arte, la Storia e il Paesaggio</span>
                    </>
                  )}
                </h1>
              </Editable>

              {/* DESCRIZIONE */}
              <Editable
                id="hero.desc"
                label="Descrizione hero"
                kind="string"
                stringKey="hero.desc"
                section="Hero"
                values={stringValues(strings, "hero.desc")}
                as="block"
              >
                <p className="text-base sm:text-lg md:text-xl text-text-muted leading-relaxed mb-6 sm:mb-8 max-w-2xl font-light">
                  {t("hero.desc")}
                </p>
              </Editable>

              {/* Highlights 2x2 sia mobile che desktop compatto */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3.5 mb-4 sm:mb-8">
                {HIGHLIGHT_DEFAULTS.map((h) => (
                  <EditableHighlight key={h.key} h={h} strings={strings} />
                ))}
              </div>

              {/* CTA Buttons - affiancati su mobile su singola riga perfettamente allineati */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-4 w-full">
                <a
                  href="#prenota"
                  className="btn btn-primary h-10 sm:h-12 w-full sm:w-auto px-2 xs:px-3 sm:px-6 py-0 text-xs sm:text-base shadow-md inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <Editable
                    id="hero.btnBook"
                    label="CTA prenota (Hero)"
                    kind="string"
                    stringKey="hero.btnBook"
                    section="Hero"
                    values={stringValues(strings, "hero.btnBook")}
                    className="truncate"
                  >
                    <span className="truncate">{t("hero.btnBook")}</span>
                  </Editable>
                </a>
                <a
                  href="#tour"
                  className="btn btn-secondary h-10 sm:h-12 w-full sm:w-auto px-2 xs:px-3 sm:px-6 py-0 text-xs sm:text-base inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-terracotta shrink-0" />
                  <Editable
                    id="hero.btnExplore"
                    label="CTA esplora (Hero)"
                    kind="string"
                    stringKey="hero.btnExplore"
                    section="Hero"
                    values={stringValues(strings, "hero.btnExplore")}
                    className="truncate"
                  >
                    <span className="truncate">{t("hero.btnExplore")}</span>
                  </Editable>
                </a>
              </div>
            </div>
          </div>

          {/* DESTRA / CENTRO MOBILE: Logo con effetto Reveal (order-2 su mobile: subito sotto i banner) */}
          <div className="order-2 lg:order-2 lg:col-span-5 flex justify-center items-center mb-4 sm:mb-6 lg:mb-0 w-full">
            <div className="w-full flex justify-center items-center">
              <HoverRevealLogo
                topSrc={strings["hero.logo_top"]?.it || "/loghi/Guida-Veneto-e-Trentino.png"}
                bottomSrc={strings["hero.logo_bottom"]?.it || "/loghi/Guida-7-comuni.png"}
                topAlt="Guida Turistica Veneto e Trentino - Davide Apolloni"
                bottomAlt="Guida Turistica 7 Comuni - Davide Apolloni"
                size={620}
                revealRadius={110}
                initialSwapped={logosSwapped}
              />
            </div>
          </div>
        </div>

        {/* ===== STATS BAR IN BASSO (Modificabile in Live Edit) ===== */}
        <div className="mt-6 sm:mt-14 pt-4 sm:pt-8 border-t border-black/[0.06] grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-6 text-center w-full">
          {/* Stat 1: Anni di Esperienza */}
          <div className="p-1.5 xs:p-2 sm:p-3 min-w-0 flex flex-col justify-center items-center">
            <Editable
              id="hero.stat1.val"
              label="Stat 1 - Numero / Anni"
              kind="string"
              stringKey="hero.stat1.val"
              section="Hero"
              values={stringValues(strings, "hero.stat1.val", `${years}+`)}
              as="block"
            >
              <div
                className="font-serif font-bold text-terracotta mb-0.5 sm:mb-1 whitespace-normal break-words md:whitespace-nowrap md:break-normal leading-tight sm:leading-[0.95] w-full text-base xs:text-xl sm:text-2xl md:text-4xl text-center"
                title={strings["hero.stat1.val"]?.[lang] || `${years}+`}
              >
                {strings["hero.stat1.val"]?.[lang] || `${years}+`}
              </div>
            </Editable>
            <Editable
              id="hero.stat1.label"
              label="Stat 1 - Etichetta"
              kind="string"
              stringKey="hero.stat1.label"
              section="Hero"
              values={stringValues(strings, "hero.stat1.label", "Anni di Esperienza", "Years Experience")}
              as="block"
            >
              <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-text-muted leading-snug line-clamp-2 break-words w-full mx-auto">
                {strings["hero.stat1.label"]?.[lang] || (lang === "it" ? "Anni di Esperienza" : "Years Experience")}
              </div>
            </Editable>
          </div>

          {/* Stat 2: Itinerari Condotti */}
          <div className="p-1.5 xs:p-2 sm:p-3 min-w-0 flex flex-col justify-center items-center">
            <Editable
              id="hero.stat2.val"
              label="Stat 2 - Numero / Itinerari"
              kind="string"
              stringKey="hero.stat2.val"
              section="Hero"
              values={stringValues(strings, "hero.stat2.val", "500+")}
              as="block"
            >
              <div
                className="font-serif font-bold text-terracotta-dark mb-0.5 sm:mb-1 leading-tight whitespace-normal break-words md:whitespace-nowrap md:break-normal w-full text-base xs:text-xl sm:text-2xl md:text-4xl text-center"
                title={strings["hero.stat2.val"]?.[lang] || "500+"}
              >
                {strings["hero.stat2.val"]?.[lang] || "500+"}
              </div>
            </Editable>
            <Editable
              id="hero.stat2.label"
              label="Stat 2 - Etichetta"
              kind="string"
              stringKey="hero.stat2.label"
              section="Hero"
              values={stringValues(strings, "hero.stat2.label", "Itinerari Condotti", "Guided Tours")}
              as="block"
            >
              <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-text-muted leading-snug line-clamp-2 break-words w-full mx-auto">
                {strings["hero.stat2.label"]?.[lang] || (lang === "it" ? "Itinerari Condotti" : "Guided Tours")}
              </div>
            </Editable>
          </div>

          {/* Stat 3: Tour su Misura */}
          <div className="p-1.5 xs:p-2 sm:p-3 min-w-0 flex flex-col justify-center items-center">
            <Editable
              id="hero.stat3.val"
              label="Stat 3 - Percentuale / Tour"
              kind="string"
              stringKey="hero.stat3.val"
              section="Hero"
              values={stringValues(strings, "hero.stat3.val", "100%")}
              as="block"
            >
              <div
                className="font-serif font-bold text-olive-dark mb-0.5 sm:mb-1 leading-tight whitespace-normal break-words md:whitespace-nowrap md:break-normal w-full text-base xs:text-xl sm:text-2xl md:text-4xl text-center"
                title={strings["hero.stat3.val"]?.[lang] || "100%"}
              >
                {strings["hero.stat3.val"]?.[lang] || "100%"}
              </div>
            </Editable>
            <Editable
              id="hero.stat3.label"
              label="Stat 3 - Etichetta"
              kind="string"
              stringKey="hero.stat3.label"
              section="Hero"
              values={stringValues(strings, "hero.stat3.label", "Tour su Misura", "Tailor-made")}
              as="block"
            >
              <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-text-muted leading-snug line-clamp-2 break-words w-full mx-auto">
                {strings["hero.stat3.label"]?.[lang] || (lang === "it" ? "Tour su Misura" : "Tailor-made")}
              </div>
            </Editable>
          </div>

          {/* Stat 4: Lingue */}
          <div className="p-1.5 xs:p-2 sm:p-3 min-w-0 flex flex-col justify-center items-center">
            <Editable
              id="hero.stat4.val"
              label="Stat 4 - Numero Lingue"
              kind="string"
              stringKey="hero.stat4.val"
              section="Hero"
              values={stringValues(strings, "hero.stat4.val", "3")}
              as="block"
            >
              <div
                className="font-serif font-bold text-blue-adriatic mb-0.5 sm:mb-1 leading-tight whitespace-normal break-words md:whitespace-nowrap md:break-normal w-full text-base xs:text-xl sm:text-2xl md:text-4xl text-center"
                title={strings["hero.stat4.val"]?.[lang] || "3"}
              >
                {strings["hero.stat4.val"]?.[lang] || "3"}
              </div>
            </Editable>
            <Editable
              id="hero.stat4.label"
              label="Stat 4 - Etichetta"
              kind="string"
              stringKey="hero.stat4.label"
              section="Hero"
              values={stringValues(strings, "hero.stat4.label", "Lingue (IT · EN · FR)", "Languages (IT · EN · FR)")}
              as="block"
            >
              <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-text-muted leading-snug line-clamp-2 break-words w-full mx-auto">
                {strings["hero.stat4.label"]?.[lang] || (lang === "it" ? "Lingue (IT · EN · FR)" : "Languages (IT · EN · FR)")}
              </div>
            </Editable>
          </div>
        </div>
      </div>
    </section>
  );
}