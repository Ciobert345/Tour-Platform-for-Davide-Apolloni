"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Database, Sparkles, Layers } from "lucide-react";
import { useLiveEdit } from "./LiveEditProvider";
import { cn } from "@/lib/utils";

type Props = {
  /** Etichetta sezione admin (es. "Luoghi", "Eventi / Calendario") */
  adminLabel: string;
  /** Path admin (es. /admin/places) */
  adminHref?: string;
  /** Spiegazione breve */
  hint?: string;
  className?: string;
  minHeight?: string;
  children: React.ReactNode;
};

/**
 * In modalità Live Edit, segnala in modo chiaro ed elegante che questo blocco
 * contiene dati dinamici (Luoghi, Categorie, Eventi, Recensioni, Prenotazioni)
 * gestibili dal pannello Dashboard dedicato.
 */
export default function LiveEditSectionMask({
  adminLabel,
  adminHref,
  hint,
  className,
  children,
}: Props) {
  const liveEdit = useLiveEdit();
  if (!liveEdit?.enabled) return <>{children}</>;

  return (
    <div className={cn("relative my-2 rounded-md transition-all", className)}>
      {/* Banner informativo non invasivo */}
      <div className="mb-4 p-3.5 bg-gradient-to-r from-slate-900/90 via-[#244D68]/90 to-slate-900/90 text-white rounded-sm border border-slate-700/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-sm bg-[#9C1C1C]/20 border border-[#9C1C1C]/40 flex items-center justify-center text-[#9C1C1C] shrink-0">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#9C1C1C] text-white">
                Dati Dinamici
              </span>
              <p className="text-xs font-semibold text-white">
                Gestione {adminLabel}
              </p>
            </div>
            {hint && (
              <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
                {hint}
              </p>
            )}
          </div>
        </div>

        {adminHref && (
          <a
            href={adminHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4A6535] hover:bg-[#2F4220] text-white text-xs font-semibold rounded-sm transition-colors shrink-0 shadow-sm"
          >
            <span>Apri {adminLabel}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Contenuto perfettamente leggibile */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
