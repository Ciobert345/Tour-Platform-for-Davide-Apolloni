"use client";

import React, { useState } from "react";
import Image from "next/image";

interface CoinLogoProps {
  frontSrc?: string;
  backSrc?: string;
  frontAlt?: string;
  backAlt?: string;
  className?: string;
  size?: number;
}

export default function CoinLogo({
  frontSrc = "/loghi/Guida-Veneto-e-Trentino.png",
  backSrc = "/loghi/Guida-7-comuni.png",
  frontAlt = "Guida Turistica Veneto e Trentino - Davide Apolloni",
  backAlt = "Guida Turistica 7 Comuni - Davide Apolloni",
  className = "",
  size = 440,
}: CoinLogoProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isManual, setIsManual] = useState(false);

  const handleManualFlip = () => {
    setIsManual(true);
    setIsFlipped((prev) => !prev);
  };

  const resetToAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManual(false);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-[440px] select-none ${className}`}>
      {/* 3D Perspective container */}
      <div
        className="relative group cursor-pointer w-full aspect-square flex items-center justify-center"
        style={{
          perspective: "1200px",
        }}
        onClick={handleManualFlip}
        title="Clicca per girare la moneta"
      >
        {/* Ambient Warm Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-terracotta/25 via-gold/30 to-olive/20 blur-3xl -z-10 scale-95 transition-all duration-700 group-hover:scale-110 group-hover:blur-3xl group-hover:opacity-100 opacity-70" />

        {/* The Coin Element */}
        <div
          className={`w-full h-full relative duration-1000 transition-transform ease-out ${
            isManual ? "" : "animate-coin-spin"
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isManual ? (isFlipped ? "rotateY(180deg)" : "rotateY(0deg)") : undefined,
          }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
              filter: "drop-shadow(0 20px 30px rgba(30,22,10, 0.25)) drop-shadow(0 6px 12px rgba(0,0,0,0.12))",
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]">
              <Image
                src={frontSrc}
                alt={frontAlt}
                fill
                sizes="(max-width: 768px) 320px, 440px"
                priority
                className="object-contain pointer-events-none p-1"
              />
              {/* Subtle sheen highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none mix-blend-overlay opacity-60 group-hover:opacity-90 transition-opacity" />
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              filter: "drop-shadow(0 20px 30px rgba(30,22,10, 0.25)) drop-shadow(0 6px 12px rgba(0,0,0,0.12))",
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]">
              <Image
                src={backSrc}
                alt={backAlt}
                fill
                sizes="(max-width: 768px) 320px, 440px"
                priority
                className="object-contain pointer-events-none p-1"
              />
              {/* Subtle sheen highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none mix-blend-overlay opacity-60 group-hover:opacity-90 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Dynamic bottom shadow */}
        <div
          className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/25 blur-lg rounded-full -z-20 pointer-events-none ${
            isManual ? "opacity-30" : "animate-coin-shadow"
          }`}
        />
      </div>

      {/* Interactive Helper Controls */}
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={handleManualFlip}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-main bg-white/90 hover:bg-white hover:text-terracotta border border-black/10 transition-all shadow-sm hover:shadow-md cursor-pointer backdrop-blur-sm"
          title="Gira la moneta per vedere l'altro stemma"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-terracotta animate-spin-slow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Gira moneta ({isFlipped ? "7 Comuni" : "Veneto & Trentino"})</span>
        </button>

        {isManual && (
          <button
            type="button"
            onClick={resetToAuto}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium text-text-muted hover:text-text-main bg-bg-alt/80 hover:bg-bg-alt border border-black/5 transition-all cursor-pointer"
            title="Ripristina rotazione automatica"
          >
            Auto ↻
          </button>
        )}
      </div>
    </div>
  );
}
