"use client";

import Link from "next/link";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import ThemeToggle from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

export default function MapHeader() {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <header className="shrink-0 z-[1000] border-b border-black/8 dark:border-white/10 bg-[#FAF4EB]/95 dark:bg-[#1a140f]/95 backdrop-blur-md">
      <div className="px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0 no-underline">
          <img
            src="/loghi/Guida-Veneto-e-Trentino.png"
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-terracotta/40"
          />
          <span className="font-serif font-bold text-sm sm:text-base truncate text-[#1E160A] dark:text-[#f5ede2]">
            Davide Apolloni
          </span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle variant="icon" className="w-8 h-8 sm:w-8 sm:h-8" />
          <div className="inline-flex items-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/8 dark:border-white/10 gap-0.5">
            <button
              type="button"
              className={cn("w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors", lang === "it" ? "bg-terracotta text-white" : "text-[#7A6655] hover:text-[#1E160A] dark:hover:text-white")}
              onClick={() => setLang("it")}
            >
              IT
            </button>
            <button
              type="button"
              className={cn("w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors", lang === "en" ? "bg-terracotta text-white" : "text-[#7A6655] hover:text-[#1E160A] dark:hover:text-white")}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
          <Link
            href="/"
            className="hidden sm:inline text-xs font-semibold text-[#7A6655] hover:text-terracotta no-underline"
          >
            {t("map.backToSite", "Torna al sito")}
          </Link>
          <Link
            href="/#prenota"
            className="inline-flex items-center h-8 px-3 rounded-full bg-terracotta text-white text-[11px] font-bold uppercase tracking-wider no-underline"
          >
            {t("map.bookCta", "Prenota")}
          </Link>
        </div>
      </div>
    </header>
  );
}
