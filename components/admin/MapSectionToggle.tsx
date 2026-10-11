"use client";

import React, { useEffect, useState } from "react";
import { MapPinned, Eye, EyeOff, Loader2, Bell, BellOff } from "lucide-react";
import { useToast } from "./ToastProvider";
import { cn } from "@/lib/utils";

const SECTION_MAPPA = "mappa";
const SECTION_TEASER = "map-teaser";

export default function MapSectionToggle() {
  const [mapVisible, setMapVisible] = useState(true);
  const [teaserEnabled, setTeaserEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState(false);
  const [savingTeaser, setSavingTeaser] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/section-visibility");
        const data = (await res.json()) as Record<string, boolean>;
        if (alive) {
          if (SECTION_MAPPA in data) {
            setMapVisible(data[SECTION_MAPPA] !== false);
          }
          if (SECTION_TEASER in data) {
            setTeaserEnabled(data[SECTION_TEASER] !== false);
          }
        }
      } catch (e: unknown) {
        console.warn("MapSectionToggle fetch error:", (e as Error)?.message ?? e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleToggleMap(next: boolean) {
    setSavingMap(true);
    try {
      const res = await fetch("/api/section-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: SECTION_MAPPA, hidden: !next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Salvataggio non riuscito");
      }
      setMapVisible(next);
      notify(
        "success",
        next
          ? "Sezione mappa visibile nel menu e in /mappa"
          : "Sezione mappa nascosta dal sito pubblico"
      );
    } catch (e: unknown) {
      notify("error", (e as Error)?.message ?? "Errore durante il salvataggio");
    } finally {
      setSavingMap(false);
    }
  }

  async function handleToggleTeaser(next: boolean) {
    setSavingTeaser(true);
    try {
      const res = await fetch("/api/section-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: SECTION_TEASER, hidden: !next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Salvataggio non riuscito");
      }
      setTeaserEnabled(next);
      notify(
        "success",
        next
          ? "Banner mappa attivo: verrà mostrato ai visitatori"
          : "Banner mappa disabilitato: i visitatori non lo vedranno"
      );
    } catch (e: unknown) {
      notify("error", (e as Error)?.message ?? "Errore durante il salvataggio");
    } finally {
      setSavingTeaser(false);
    }
  }

  return (
    <div className="rounded-sm border shadow-sm overflow-hidden bg-white dark:bg-[#1c1611] border-stone/40 dark:border-[#382b20] divide-y divide-black/8 dark:divide-white/8 transition-colors">
      {/* ── ROW 1: Sezione Mappa ── */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-sm flex items-center justify-center shrink-0",
                mapVisible
                  ? "bg-[#9C1C1C]/10 text-[#9C1C1C] dark:bg-[#9C1C1C]/20 dark:text-[#f07f82]"
                  : "bg-black/5 dark:bg-white/8 text-[#7A6655] dark:text-[#a89582]"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mapVisible ? (
                <MapPinned className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base font-serif leading-tight text-[#1E160A] dark:text-[#f5ede2]">
                Sezione Mappa
              </h3>
              <p className="text-xs md:text-sm mt-0.5 leading-relaxed text-[#5C4C38] dark:text-[#c7b59f]">
                {mapVisible
                  ? "La mappa è nel menu del sito, nel footer e raggiungibile da /mappa."
                  : "La mappa è nascosta ai visitatori. Il pannello admin resta accessibile."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                mapVisible
                  ? "bg-[#4A6535]/10 border-[#4A6535]/25 text-[#4A6535] dark:text-[#a6cf8c] dark:border-[#a6cf8c]/30"
                  : "bg-stone/20 dark:bg-white/10 border-stone/30 dark:border-white/15 text-[#7A6655] dark:text-[#c7b59f]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Controllo…
                </>
              ) : mapVisible ? (
                <>
                  <Eye className="w-3 h-3" /> Visibile
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Nascosta
                </>
              )}
            </div>

            <button
              type="button"
              disabled={loading || savingMap}
              onClick={() => handleToggleMap(!mapVisible)}
              className={cn(
                "relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-sm border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1c1611] disabled:cursor-not-allowed disabled:opacity-60",
                mapVisible ? "bg-[#4A6535]" : "bg-stone/50 dark:bg-white/20"
              )}
              role="switch"
              aria-checked={mapVisible}
              aria-label="Mostra o nascondi la sezione mappa sul sito"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-sm bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                  mapVisible ? "translate-x-8" : "translate-x-0"
                )}
              />
              {savingMap && (
                <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-[#1E160A]/60 animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Banner Teaser Mappa ── */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-sm flex items-center justify-center shrink-0",
                teaserEnabled
                  ? "bg-[#9C1C1C]/10 text-[#9C1C1C] dark:bg-[#9C1C1C]/20 dark:text-[#f07f82]"
                  : "bg-black/5 dark:bg-white/8 text-[#7A6655] dark:text-[#a89582]"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : teaserEnabled ? (
                <Bell className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base font-serif leading-tight text-[#1E160A] dark:text-[#f5ede2]">
                Banner &ldquo;Esplora la mappa&rdquo;
              </h3>
              <p className="text-xs md:text-sm mt-0.5 leading-relaxed text-[#5C4C38] dark:text-[#c7b59f]">
                {teaserEnabled
                  ? "Il banner in basso a destra invita i visitatori ad aprire la mappa interattiva."
                  : "Il banner è disabilitato. I visitatori non vedranno l'invito alla mappa."}
                {!mapVisible && (
                  <span className="block mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Nota: con la sezione mappa disattivata, il banner non viene mostrato comunque.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                teaserEnabled
                  ? "bg-[#4A6535]/10 border-[#4A6535]/25 text-[#4A6535] dark:text-[#a6cf8c] dark:border-[#a6cf8c]/30"
                  : "bg-stone/20 dark:bg-white/10 border-stone/30 dark:border-white/15 text-[#7A6655] dark:text-[#c7b59f]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Controllo…
                </>
              ) : teaserEnabled ? (
                <>
                  <Eye className="w-3 h-3" /> Attivo
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Disattivato
                </>
              )}
            </div>

            <button
              type="button"
              disabled={loading || savingTeaser}
              onClick={() => handleToggleTeaser(!teaserEnabled)}
              className={cn(
                "relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-sm border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1c1611] disabled:cursor-not-allowed disabled:opacity-60",
                teaserEnabled ? "bg-[#4A6535]" : "bg-stone/50 dark:bg-white/20"
              )}
              role="switch"
              aria-checked={teaserEnabled}
              aria-label="Attiva o disattiva il banner teaser mappa"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-7 w-7 transform rounded-sm bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                  teaserEnabled ? "translate-x-8" : "translate-x-0"
                )}
              />
              {savingTeaser && (
                <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-[#1E160A]/60 animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
