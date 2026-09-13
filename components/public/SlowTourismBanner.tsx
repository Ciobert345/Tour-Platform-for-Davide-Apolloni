"use client";

import React from "react";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { imageValue, stringValues } from "@/lib/live-edit/helpers";
import { Footprints } from "lucide-react";

function colorWithOpacity(color: string, opacity: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${alpha}`;
}

export default function SlowTourismBanner() {
  const t = useT();
  const { strings } = useLanguage();
  const slowIcon = strings["slow.icon"]?.it || "Hourglass";
  const [bannerImage, setBannerImage] = React.useState(strings["slow.banner_image"]?.it || "");
  const [bannerColor, setBannerColor] = React.useState(strings["slow.banner_color"]?.it || "#F9F4EC");
  const isDark = /^#[0-9a-f]{6}$/i.test(bannerColor) && (() => {
    const rgb = [1, 3, 5].map((i) => parseInt(bannerColor.slice(i, i + 2), 16) / 255);
    const linear = rgb.map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2] < 0.45;
  })();
  const foreground = isDark ? "#FFFFFF" : "#1E160A";
  const secondary = isDark ? "rgba(255,255,255,.86)" : "#5C4C38";

  React.useEffect(() => {
    setBannerImage(strings["slow.banner_image"]?.it || "");
    setBannerColor(strings["slow.banner_color"]?.it || "#F9F4EC");
  }, [strings]);

  React.useEffect(() => {
    const onUpdate = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "LIVE_EDIT_UPDATED" && event.data.targetId === "slow.banner.image") {
        setBannerImage(event.data.values?.url || event.data.values?.it || "");
      }
      if (event.data?.type === "LIVE_EDIT_UPDATED" && event.data.targetId === "slow.banner.color") {
        setBannerColor(event.data.values?.it || "#F9F4EC");
      }
    };
    window.addEventListener("message", onUpdate);
    return () => window.removeEventListener("message", onUpdate);
  }, []);

  return (
    <section id="slow-tourism" className="py-10 sm:py-16 md:py-20 bg-bg-main relative overflow-hidden">
      <div className="container-app">
        <Editable
          id="slow.banner.image"
          label="Slow Tourism — immagine di sfondo"
          kind="image"
          stringKey="slow.banner_image"
          section="Slow Tourism"
          values={imageValue(bannerImage)}
          as="block"
          className="max-w-5xl mx-auto"
        >
        <Editable
          id="slow.banner.color"
          label="Slow Tourism — colore della card"
          kind="style"
          stringKey="slow.banner_color"
          section="Slow Tourism"
          values={stringValues(strings, "slow.banner_color", "#F9F4EC", "#F9F4EC")}
          as="block"
        >
        <div
          className="border border-gold/40 rounded-xl shadow-sm p-5 sm:p-8 md:p-12 flex flex-col md:flex-row gap-5 sm:gap-6 md:gap-10 items-start md:items-center relative overflow-hidden"
          style={{
            backgroundColor: bannerColor,
            // La tinta viene sopra l'immagine: il colore resta quindi visibile anche con una foto caricata.
            backgroundImage: bannerImage
              ? `linear-gradient(${colorWithOpacity(bannerColor, 0.86)}, ${colorWithOpacity(bannerColor, 0.86)}), url("${bannerImage}")`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: foreground,
          }}
        >
          {/* Decoro di sfondo */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-olive/10 rounded-full blur-3xl pointer-events-none" />

          <div className="shrink-0 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark text-text-white flex items-center justify-center shadow-md ring-4 ring-gold/25">
              <EditableIcon
                id="slow.icon"
                iconName={slowIcon}
                stringKey="slow.icon"
                label="Icona Slow Tourism"
                className="text-text-white"
                iconProps={{ className: "w-8 h-8 md:w-10 md:h-10 text-text-white", strokeWidth: 1.6 }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            <div className="mb-2">
              <Editable
                id="slow.tag"
                label="Slow tourism — eyebrow"
                kind="string"
                stringKey="slow.tag"
                section="Slow Tourism"
                values={stringValues(strings, "slow.tag")}
              >
                <span className="eyebrow-gold" style={{ color: foreground, borderColor: isDark ? "rgba(255,255,255,.4)" : undefined }}>
                  <Footprints className="w-3 h-3" style={{ color: foreground }} />
                  {t("slow.tag")}
                </span>
              </Editable>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl md:text-[2rem] font-bold mb-3 leading-tight" style={{ color: foreground }}>
              <Editable
                id="slow.title"
                label="Slow tourism — titolo"
                kind="string"
                stringKey="slow.title"
                section="Slow Tourism"
                values={stringValues(strings, "slow.title")}
                as="block"
              >
                <span>{t("slow.title")}</span>
              </Editable>
            </h3>

            <Editable
              id="slow.text"
              label="Slow tourism — testo"
              kind="string"
              stringKey="slow.text"
              section="Slow Tourism"
              values={stringValues(strings, "slow.text")}
              as="block"
            >
              <p className="text-sm sm:text-base leading-relaxed font-light" style={{ color: secondary }}>{t("slow.text")}</p>
            </Editable>
          </div>
        </div>
        </Editable>
        </Editable>
      </div>
    </section>
  );
}
