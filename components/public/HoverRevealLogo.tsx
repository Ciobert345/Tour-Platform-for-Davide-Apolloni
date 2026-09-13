"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useLiveEdit } from "@/components/live-edit/LiveEditProvider";
import supabase from "@/lib/supabase/browser";

interface HoverRevealLogoProps {
  topSrc?: string;
  bottomSrc?: string;
  topAlt?: string;
  bottomAlt?: string;
  className?: string;
  size?: number;
  revealRadius?: number; // in pixels
  initialSwapped?: boolean;
  onSwappedChange?: (swapped: boolean) => void;
}

const LOCAL_SWAP_KEY = "logos_swapped_local";

export default function HoverRevealLogo({
  topSrc = "/loghi/Guida-Veneto-e-Trentino.png",
  bottomSrc = "/loghi/Guida-7-comuni.png",
  topAlt = "Guida Turistica Veneto e Trentino - Davide Apolloni",
  bottomAlt = "Guida Turistica 7 Comuni - Davide Apolloni",
  className = "",
  size = 520,
  revealRadius = 120,
  initialSwapped = false,
  onSwappedChange,
}: HoverRevealLogoProps) {
  const liveEdit = useLiveEdit();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 260, y: 260 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSwapped, setIsSwapped] = useState(initialSwapped);
  const [savingSwap, setSavingSwap] = useState(false);

  useEffect(() => {
    setIsSwapped(initialSwapped);
  }, [initialSwapped]);

  // Se l'utente (non in Live Edit) ha già invertito i loghi in passato,
  // ripristina la sua preferenza personale salvata nel browser.
  useEffect(() => {
    if (liveEdit?.enabled) return; // in Live Edit vince sempre il valore dal DB
    try {
      const saved = window.localStorage.getItem(LOCAL_SWAP_KEY);
      if (saved !== null) {
        setIsSwapped(saved === "true");
      }
    } catch {
      // localStorage non disponibile (SSR/privacy mode) — ignora
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEdit?.enabled]);

  const updateCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    setPos({ x, y });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY);
    setIsHovered(true);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
      setIsHovered(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
      setIsHovered(true);
    }
  };

  const handleTouchEnd = () => {
    // Keep visible briefly or fade out
    setIsHovered(false);
  };

  const toggleSwap = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSwapped;
    setIsSwapped(next);
    if (onSwappedChange) onSwappedChange(next);

    if (liveEdit?.enabled) {
      // Admin: cambia l'ordine dei loghi per TUTTI i visitatori (salvato su Supabase)
      setSavingSwap(true);
      try {
        const now = new Date().toISOString();
        await (supabase.from("ui_strings") as any).upsert(
          {
            key: "hero.logos_swapped",
            it: next ? "true" : "false",
            en: next ? "true" : "false",
            description: "Inverti ordine loghi nella hero (true = scambiati)",
            updated_at: now,
          },
          { onConflict: "key" }
        );
      } finally {
        setSavingSwap(false);
      }
    } else {
      // Utente normale: la preferenza resta solo sul suo browser
      try {
        window.localStorage.setItem(LOCAL_SWAP_KEY, String(next));
      } catch {
        // ignora se localStorage non è disponibile
      }
    }
  };

  const currentTopSrc = isSwapped ? bottomSrc : topSrc;
  const currentBottomSrc = isSwapped ? topSrc : bottomSrc;
  const currentTopAlt = isSwapped ? bottomAlt : topAlt;
  const currentBottomAlt = isSwapped ? topAlt : bottomAlt;

  // Mask calculation:
  // Inside revealRadius: transparent (reveals bottom layer)
  // Outside revealRadius: opaque black (shows top layer)
  const maskStyle: React.CSSProperties = isHovered
    ? {
      maskImage: `radial-gradient(circle ${revealRadius}px at ${Math.round(pos.x - 8)}px ${Math.round(pos.y - 8)}px, transparent 0%, transparent 60%, black 100%)`,
      WebkitMaskImage: `radial-gradient(circle ${revealRadius}px at ${Math.round(pos.x - 8)}px ${Math.round(pos.y - 8)}px, transparent 0%, transparent 60%, black 100%)`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      transition: "mask-image 0.05s ease-out, -webkit-mask-image 0.05s ease-out",
    }
    : {
      maskImage: "none",
      WebkitMaskImage: "none",
      transition: "mask-image 0.3s ease-out, -webkit-mask-image 0.3s ease-out",
    };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Interactive Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative group cursor-crosshair rounded-full shrink-0 w-[260px] h-[260px] xs:w-[300px] xs:h-[300px] sm:w-[380px] sm:h-[380px] md:w-[430px] md:h-[430px] lg:w-[480px] lg:h-[480px] max-w-[90vw] max-h-[90vw]"
        style={{
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
        }}
        title="Passa sopra con il cursore per svelare il logo sottostante"
      >
        {/* Ambient Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-terracotta/20 via-gold/25 to-olive/20 blur-3xl -z-10 transition-all duration-500 group-hover:opacity-100 opacity-70 pointer-events-none" />

        {/* Drop shadow & content wrapper - absolute inset-0 guarantees full square dimensions */}
        <div className="absolute inset-0 rounded-full p-2 drop-shadow-[0_20px_35px_rgba(30,22,10,0.22)]">
          {/* BOTTOM LAYER (Always underneath) */}
          <div className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src={currentBottomSrc}
              alt={currentBottomAlt}
              fill
              unoptimized
              priority
              sizes="(max-width: 768px) 380px, 520px"
              className="object-contain pointer-events-none p-1"
            />
          </div>

          {/* TOP LAYER (With dynamic transparent mask) */}
          <div
            className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center pointer-events-none"
            style={isHovered ? maskStyle : undefined}
          >
            <Image
              src={currentTopSrc}
              alt={currentTopAlt}
              fill
              unoptimized
              priority
              sizes="(max-width: 768px) 380px, 520px"
              className="object-contain pointer-events-none p-1"
            />
            {/* Subtle sheen on top */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none mix-blend-overlay opacity-60" />
          </div>
        </div>

        {/* Soft bottom shadow */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/25 blur-lg rounded-full -z-20 pointer-events-none" />
      </div>

      {/* Helper Bar / Switcher — visibile a TUTTI gli utenti; comportamento diverso per admin/visitatori */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={toggleSwap}
          disabled={savingSwap}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-text-main bg-bg-warm/80 hover:bg-bg-warm hover:text-terracotta border border-[#9C1C1C]/30 transition-all shadow-2xs hover:shadow-xs cursor-pointer ring-1 ring-[#9C1C1C]/20 disabled:opacity-60"
          title={
            liveEdit?.enabled
              ? "Inverti quale logo sta sopra e quale sotto (per tutti i visitatori)"
              : "Inverti l'ordine dei loghi (solo per te)"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-terracotta"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m16 3 4 4-4 4" />
            <path d="M20 7H4" />
            <path d="m8 21-4-4 4-4" />
            <path d="M4 17h16" />
          </svg>
          <span>
            {savingSwap
              ? "Salvataggio..."
              : liveEdit?.enabled
                ? "Inverti Ordine Loghi"
                : "Visualizza altro logo "}
          </span>
        </button>
      </div>
    </div>
  );
}