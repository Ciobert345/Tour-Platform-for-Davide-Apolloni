"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import EditableBanner, { type BannerData } from "@/components/live-edit/EditableBanner";
import { useLiveEdit } from "@/components/live-edit/LiveEditProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroBannerRotatorProps {
  banners: BannerData[];
  lang: "it" | "en";
}

export default function HeroBannerRotator({ banners, lang }: HeroBannerRotatorProps) {
  const liveEdit = useLiveEdit();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset dell'indice se supera il numero di banner disponibili
  useEffect(() => {
    if (currentIndex >= banners.length && banners.length > 0) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  const changeSlide = useCallback(
    (newIndex: number) => {
      if (newIndex === currentIndex || banners.length <= 1) return;
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setIsFading(false);
      }, 160);
    },
    [currentIndex, banners.length]
  );

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    const next = (currentIndex + 1) % banners.length;
    changeSlide(next);
  }, [currentIndex, banners.length, changeSlide]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    const prev = (currentIndex - 1 + banners.length) % banners.length;
    changeSlide(prev);
  }, [currentIndex, banners.length, changeSlide]);

  // Autoplay discreto: ogni 6 secondi, pausato all'hover o se in Live Edit
  useEffect(() => {
    if (banners.length <= 1 || isPaused || liveEdit?.enabled) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused, liveEdit?.enabled, nextSlide]);

  if (!banners || banners.length === 0) return null;

  // Se c'è un solo banner, mostralo direttamente senza comandi
  if (banners.length === 1) {
    return <EditableBanner banner={banners[0]} lang={lang} />;
  }

  const activeBanner = banners[currentIndex] || banners[0];

  // Micro-controlli integrati ALL'INTERNO della pillola (stesso sfondo, stesso colore, zero elementi estranei)
  const integratedControls = (
    <div
      className="inline-flex items-center gap-1 pl-2.5 sm:pl-3 border-l border-current/25 shrink-0 text-current select-none"
      onClick={(e) => {
        // Evita di aprire il drawer di modifica testo quando si clicca per cambiare banner
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Banner precedente"
        title="Precedente"
        className="p-0.5 rounded-full hover:bg-current/15 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <span className="text-[10px] sm:text-[11px] font-mono tabular-nums opacity-75 px-0.5 tracking-tight">
        {currentIndex + 1}/{banners.length}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Banner successivo"
        title="Successivo"
        className="p-0.5 rounded-full hover:bg-current/15 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div
      className="relative inline-flex flex-col items-center lg:items-start max-w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        setIsPaused(true);
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current !== null) {
          const deltaX = e.changedTouches[0].clientX - touchStartX.current;
          if (deltaX > 40) {
            prevSlide();
          } else if (deltaX < -40) {
            nextSlide();
          }
          touchStartX.current = null;
        }
        setIsPaused(false);
      }}
      aria-live="polite"
    >
      {/* SELETTORE LIVE EDIT (visibile SOLO all'amministratore in modalità modifica) */}
      {liveEdit?.enabled && (
        <div className="flex items-center gap-1.5 text-xs font-semibold bg-terracotta/10 dark:bg-terracotta/20 border border-terracotta/30 text-terracotta-dark dark:text-[#f59b9e] px-2.5 py-1 rounded-md mb-2 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider font-bold">Modifica:</span>
          {banners.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] transition-colors",
                idx === currentIndex
                  ? "bg-terracotta text-white font-bold shadow-xs"
                  : "bg-white/80 dark:bg-black/40 hover:bg-white text-text-main dark:text-text-white"
              )}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* PILLOLA UNICA CONTINUA: Icona, testo e controlli dentro lo stesso identico contenitore */}
      <div
        className="transition-opacity duration-200 ease-out max-w-full"
        style={{ opacity: isFading ? 0 : 1 }}
      >
        <EditableBanner
          key={activeBanner.id}
          banner={activeBanner}
          lang={lang}
          controls={integratedControls}
        />
      </div>
    </div>
  );
}
