"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "./ToastProvider";
import { cn } from "@/lib/utils";

const SECTION_ID = "map-teaser";

export default function MapTeaserToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/section-visibility");
        const data = (await res.json()) as Record<string, boolean>;
        if (alive) {
          // hidden["map-teaser"] === true → banner disabilitato
          setEnabled(data[SECTION_ID] !== false);
        }
      } catch (e: unknown) {
        console.warn("MapTeaserToggle fetch error:", (e as Error)?.message ?? e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function handleToggle(next: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/section-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: SECTION_ID, hidden: !next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Salvataggio non riuscito");
      }
      setEnabled(next);
      notify(
        "success",
        next
          ? "Banner mappa attivo: verrà mostrato ai visitatori"
          : "Banner mappa disabilitato: i visitatori non lo vedranno"
      );
    } catch (e: unknown) {
      notify("error", (e as Error)?.message ?? "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-sm border shadow-sm overflow-hidden transition-colors",
        enabled
          ? "bg-white dark:bg-[#1c1611] border-stone/40 dark:border-[#382b20] text-[#1E160A] dark:text-[#f5ede2]"
          : "bg-[#F5F0E8] dark:bg-[#1a1410] border-[#D5C8B0]/60 dark:border-[#382b20] text-[#5C4C38] dark:text-[#c7b59f]"
      )}
    >
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-sm flex items-center justify-center shrink-0",
                enabled
                  ? "bg-[#9C1C1C]/10 text-[#9C1C1C] dark:bg-[#9C1C1C]/20 dark:text-[#f07f82]"
                  : "bg-black/5 dark:bg-white/8 text-[#7A6655] dark:text-[#a89582]"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : enabled ? (
                <Bell className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base font-serif leading-tight text-[#1E160A] dark:text-[#f5ede2]">
                Banner &ldquo;Esplora la mappa&rdquo;
              </h3>
              <p className="text-sm mt-1 leading-relaxed text-[#5C4C38] dark:text-[#c7b59f]">
                {enabled
                  ? "Il banner in basso a destra invita i visitatori ad aprire la mappa interattiva."
                  : "Il banner è disabilitato. I visitatori non vedranno l'invito alla mappa."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                enabled
                  ? "bg-[#4A6535]/10 border-[#4A6535]/25 text-[#4A6535] dark:text-[#a6cf8c] dark:border-[#a6cf8c]/30"
                  : "bg-black/5 dark:bg-white/8 border-black/10 dark:border-white/10 text-[#7A6655] dark:text-[#a89582]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Controllo…
                </>
              ) : enabled ? (
                <>
                  <Eye className="w-3 h-3" /> Attivo
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Disabilitato
                </>
              )}
            </div>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleToggle(!enabled)}
              className={cn(
                "relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-sm border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1c1611] disabled:cursor-not-allowed disabled:opacity-60",
                enabled ? "bg-[#4A6535]" : "bg-stone/50 dark:bg-white/20"
              )}
              role="switch"
              aria-checked={enabled}
              aria-label="Abilita o disabilita il banner mappa sulla homepage"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-sm bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                  enabled ? "translate-x-8" : "translate-x-0"
                )}
              />
              {saving && (
                <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-[#1E160A]/60 animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
