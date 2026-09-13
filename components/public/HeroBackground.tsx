"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage, useLang } from "@/lib/i18n/LanguageProvider";

const DEFAULT_HERO_BG =
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80";

export default function HeroBackground() {
  const [failed, setFailed] = useState(false);
  const { strings } = useLanguage();
  const { lang } = useLang();

  const heroBg =
    strings["hero.bg_image"]?.[lang] ||
    strings["hero.bg_image"]?.it ||
    DEFAULT_HERO_BG;

  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-alt via-stone to-olive/25" />
      <div className="w-full h-full relative">
        {!failed && (
          <Image
            src={heroBg}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/85 to-bg-main/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-main/40 pointer-events-none" />
    </div>
  );
}