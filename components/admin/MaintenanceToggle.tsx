"use client";

import React, { useEffect, useState } from "react";
import { Wrench, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "./ToastProvider";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";

export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb
          .from("ui_strings" as any)
          .select("it")
          .eq("key", "site.maintenance_mode")
          .maybeSingle() as any;
        if (alive) setEnabled((data as any)?.it === "true");
      } catch (e: any) {
        console.warn("MaintenanceToggle fetch error:", e?.message ?? e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleToggle(next: boolean) {
    setSaving(true);
    try {
      const sb = createClient();
      const val = next ? "true" : "false";
      const { error } = await (sb.from("ui_strings" as any) as any).upsert(
        { key: "site.maintenance_mode", it: val, en: val },
        { onConflict: "key" }
      );
      if (error) throw error;
      setEnabled(next);
      notify("success", next ? "Modalità manutenzione attivata" : "Modalità manutenzione disattivata");
    } catch (e: any) {
      notify("error", e?.message ?? "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-sm border shadow-sm overflow-hidden transition-colors",
        enabled
          ? "bg-gradient-to-r from-[#7A1F2A] to-[#9C1C1C] border-[#9C1C1C]/40 text-white"
          : "bg-white border-stone/40 text-[#1E160A]"
      )}
    >
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-sm flex items-center justify-center shrink-0",
                enabled ? "bg-white/15 text-white" : "bg-[#9C1C1C]/10 text-[#9C1C1C]"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : enabled ? (
                <Wrench className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg font-serif leading-tight text-white">
                Modalità Manutenzione
              </h3>
              <p
                className={cn(
                  "text-sm mt-1 leading-relaxed",
                  enabled ? "text-white/80" : "text-[#5C4C38]"
                )}
              >
                {enabled
                  ? "I visitatori vedono solo la pagina 'Sito in Costruzione'. Pannello admin sempre accessibile."
                  : "Sito online normalmente. Attiva per lavori o aggiornamenti programmati."}
              </p>
              <p
                className={cn(
                  "text-[11px] mt-1.5",
                  enabled ? "text-white/60" : "text-[#92816A]"
                )}
              >
                Tempo di propagazione massimo 180 secondi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                enabled
                  ? "bg-white/10 border-white/25 text-white"
                  : "bg-[#4A6535]/10 border-[#4A6535]/25 text-[#4A6535]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Controllo…
                </>
              ) : enabled ? (
                <>
                  <AlertTriangle className="w-3 h-3" /> Attiva
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Sito Online
                </>
              )}
            </div>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() => handleToggle(!enabled)}
              className={cn(
                "relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-sm border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                enabled ? "bg-white/25" : "bg-stone/50"
              )}
              role="switch"
              aria-checked={enabled}
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
