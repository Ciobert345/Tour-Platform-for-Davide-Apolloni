"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "da-map-teaser-v2-dismissed";

export default function MapTeaserBanner({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [enabled]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible || !enabled) return null;

  return (
    <>
      {/* ── VERSIONE MOBILE (Mini-chip discreto in basso a destra, non invasivo) ── */}
      <div
        role="complementary"
        aria-label="Scopri la mappa interattiva"
        className="
          md:hidden
          fixed bottom-[72px] right-3
          z-[900]
          pointer-events-auto
          animate-in fade-in slide-in-from-bottom-2 duration-300
        "
      >
        <div className="
          flex items-center gap-1.5
          bg-white/95 dark:bg-[#1a140f]/95
          backdrop-blur-md
          rounded-full
          border border-black/8 dark:border-white/10
          shadow-md shadow-black/10
          pl-2.5 pr-1.5 py-1
        ">
          <Link
            href="/mappa"
            onClick={dismiss}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1E160A] dark:text-[#f5ede2] hover:text-[#9C1C1C] no-underline"
          >
            <span className="w-2 h-2 rounded-full bg-[#9C1C1C] animate-pulse" />
            <span>Mappa</span>
          </Link>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Chiudi avviso"
            className="
              w-4 h-4 rounded-full
              bg-black/5 dark:bg-white/10
              flex items-center justify-center
              text-[#7A6655] dark:text-[#c7b59f]
              hover:bg-black/10 dark:hover:bg-white/20
              transition-colors
              ml-0.5
            "
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* ── VERSIONE DESKTOP (Elegante card d'angolo in basso a destra) ── */}
      <div
        role="complementary"
        aria-label="Scopri la mappa interattiva"
        className="
          hidden md:block
          fixed bottom-5 right-5
          z-[999]
          w-[290px]
          pointer-events-auto
          animate-in fade-in slide-in-from-right-3 duration-300
        "
      >
        <div className="
          relative
          bg-white/96 dark:bg-[#1c1611]/96
          backdrop-blur-md
          rounded-2xl
          border border-black/10 dark:border-white/10
          shadow-xl shadow-black/12
          p-3.5
          overflow-hidden
        ">
          <div className="flex items-start gap-2.5 relative">
            <div className="shrink-0 w-8 h-8 rounded-xl bg-[#9C1C1C]/10 dark:bg-[#9C1C1C]/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-[#9C1C1C]" />
            </div>
            <div className="flex-1 min-w-0 pr-5">
              <p className="text-[12px] font-semibold text-[#1E160A] dark:text-[#f5ede2] leading-tight">
                Esplora la mappa
              </p>
              <p className="text-[10.5px] text-[#7A6655] dark:text-[#c7b59f] leading-snug mt-0.5">
                Scopri tutti i luoghi in Veneto e Trentino
              </p>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Chiudi avviso mappa"
              className="
                absolute top-0 right-0
                w-5 h-5 rounded-full
                bg-black/6 dark:bg-white/8
                flex items-center justify-center
                text-[#7A6655] dark:text-[#c7b59f]
                hover:bg-black/12 dark:hover:bg-white/15
                transition-colors
              "
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>

          <Link
            href="/mappa"
            onClick={dismiss}
            className="
              mt-2.5 w-full flex items-center justify-center gap-1.5
              px-3 py-1.5 rounded-xl
              bg-[#9C1C1C] hover:bg-[#7a1515]
              text-white text-[11px] font-semibold
              transition-colors shadow-sm
            "
          >
            <span>Apri la mappa interattiva</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </>
  );
}
