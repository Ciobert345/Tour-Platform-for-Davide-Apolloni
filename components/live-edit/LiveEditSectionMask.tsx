"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ExternalLink, Database, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLiveEdit } from "./LiveEditProvider";
import { cn } from "@/lib/utils";

type Props = {
  adminLabel: string;
  adminHref?: string;
  hint?: string;
  className?: string;
  minHeight?: string;
  /**
   * ID dell'elemento <section> padre.
   * Se fornito, il toggle persiste la visibilità su Supabase (ui_strings)
   * e applica la classe live-section-hidden sulla sezione per nascondere
   * heading e divider, mantenendo sempre visibile il banner.
   */
  sectionId?: string;
  /**
   * Stato iniziale di visibilità letto lato server (da hiddenSections).
   * In modalità pubblica nasconde il contenuto se true.
   * In live edit mode il banner è sempre visibile e questo valore
   * viene usato solo come stato iniziale prima del fetch API.
   */
  defaultHidden?: boolean;
  children: React.ReactNode;
};

export default function LiveEditSectionMask({
  adminLabel,
  adminHref,
  hint,
  className,
  sectionId,
  defaultHidden = false,
  children,
}: Props) {
  const liveEdit = useLiveEdit();
  // In live edit, partiamo da visible=true e poi carichiamo dal server
  // In modalità pubblica, usiamo defaultHidden passato dal server
  const [visible, setVisible] = useState(!defaultHidden);
  const [saving, setSaving] = useState(false);

  // Carica lo stato iniziale di visibilità dal server
  useEffect(() => {
    if (!sectionId || !liveEdit?.enabled) return;
    fetch("/api/section-visibility")
      .then((r) => r.json())
      .then((data: Record<string, boolean>) => {
        if (sectionId in data) {
          setVisible(data[sectionId]);
        }
      })
      .catch(() => {});
  }, [sectionId, liveEdit?.enabled]);

  // Applica la classe CSS sulla <section> padre (solo in live edit mode)
  useEffect(() => {
    if (!sectionId || !liveEdit?.enabled) return;
    const el = document.getElementById(sectionId);
    if (!el) return;
    // Rimuove il display:none inline impostato dal SSR (defaultHidden)
    // così la sezione e il banner sono sempre visibili nell'editor
    el.style.display = "";
    if (!visible) {
      el.classList.add("live-section-hidden");
    } else {
      el.classList.remove("live-section-hidden");
    }
    return () => el.classList.remove("live-section-hidden");
  }, [visible, sectionId, liveEdit?.enabled]);

  const handleToggle = useCallback(async () => {
    const next = !visible;
    setVisible(next);

    if (!sectionId) return;
    setSaving(true);
    try {
      await fetch("/api/section-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, hidden: !next }),
      });
    } catch {
      // silently fail — UI state already updated
    } finally {
      setSaving(false);
    }
  }, [visible, sectionId]);

  if (!liveEdit?.enabled) {
    if (defaultHidden) return null;
    return <>{children}</>;
  }

  return (
    <div className={cn("relative my-2 rounded-md transition-all", className)}>
      {/* Banner — sempre visibile anche quando la sezione è collassata */}
      <div
        data-live-banner
        className="mb-4 p-3.5 bg-gradient-to-r from-slate-900/90 via-[#244D68]/90 to-slate-900/90 text-white rounded-sm border border-slate-700/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle visibilità con salvataggio */}
          <button
            onClick={handleToggle}
            disabled={saving}
            title={visible ? "Nascondi sezione dal sito" : "Mostra sezione sul sito"}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-sm transition-colors shadow-sm disabled:opacity-60",
              visible
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-[#9C1C1C] hover:bg-[#7a1616]"
            )}
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : visible ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
            <span>{visible ? "Nascondi" : "Mostra"}</span>
          </button>

          {adminHref && (
            <a
              href={adminHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9C1C1C] hover:bg-[#7a1616] text-white text-xs font-semibold rounded-sm transition-colors shadow-sm"
            >
              <span>Apri {adminLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Contenuto */}
      {visible && (
        <div className="relative">
          {children}
        </div>
      )}

      {/* Placeholder quando collassata */}
      {!visible && (
        <div className="flex items-center justify-center py-5 rounded-sm border border-dashed border-slate-400/30 bg-slate-50/60 text-slate-400 text-xs gap-1.5">
          <EyeOff className="w-3.5 h-3.5 shrink-0" />
          <span>
            Sezione nascosta dal sito — clicca{" "}
            <strong className="text-[#9C1C1C]">Mostra</strong> qui sopra per
            renderla visibile
          </span>
        </div>
      )}
    </div>
  );
}
