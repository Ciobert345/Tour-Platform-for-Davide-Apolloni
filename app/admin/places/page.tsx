"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import TranslateButton from "@/components/admin/TranslateButton";
import { TagInput } from "@/components/admin/TagInput";
import {
  Map as MapIcon, Plus, Edit2, Trash2, Loader2, Eye,
  AlertCircle, CheckCircle2, Info, ChevronDown, ChevronRight, X, AlertTriangle,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";
import { translateLongText } from "@/lib/translateClient";

type Row = any;
type TT = any;
type PT = any;

function AutoTranslateBadge({ state }: { state: "idle" | "loading" | "success" | "error" }) {
  if (state === "idle") return null;
  const map = {
    loading: { cls: "text-blue-adriatic bg-blue-adriatic/10", Icon: Loader2, spin: true, label: "Traduzione..." },
    success: { cls: "text-olive-dark bg-olive-dark/10", Icon: CheckCircle2, spin: false, label: "Tradotto ✓" },
    error: { cls: "text-terracotta bg-terracotta/10", Icon: AlertCircle, spin: false, label: "Errore" },
  } as const;
  const conf = map[state];
  const Ico = conf.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider", conf.cls)}>
      <Ico className={cn("w-3 h-3", conf.spin && "animate-spin")} />
      {conf.label}
    </span>
  );
}

const DEF: Row = {
  id: null, slug: "", place_type_id: null,
  name_it: "", name_en: "", subtitle_it: "", subtitle_en: "",
  short_description_it: "", short_description_en: "",
  full_description_it: "", full_description_en: "",
  cover_image_url: "", duration_hours: 2,
  difficulty: "easy", location_address: "", gps_lat: null, gps_lng: null,
  highlights_it: [], highlights_en: [], tags_it: [], tags_en: [],
  min_participants: null, max_participants: null,
  transport_options: ["walk"], sort_order: 0,
  is_active: true, is_popular: false,
};

const DIFF = [
  { v: "easy", l: "Facile — Famiglie" },
  { v: "moderate", l: "Media" },
  { v: "challenging", l: "Impegnativo — Cammini" },
];
const TRANS = ["walk", "bike", "moto", "bus"];

const REQUIRED_FIELDS: Array<{ key: string; label: string; validate: (v: any) => string | null }> = [
  {
    key: "name_it",
    label: "Nome in italiano",
    validate: (v) => (!v || String(v).trim().length < 2 ? "Inserisci un nome in italiano" : null),
  },
  {
    key: "name_en",
    label: "Nome in inglese",
    validate: (v) => (!v || String(v).trim().length < 2 ? "Inserisci un nome in inglese" : null),
  },
  {
    key: "duration_hours",
    label: "Durata",
    validate: (v) => {
      const n = Number(v);
      return Number.isNaN(n) || n <= 0 ? "Inserisci una durata valida" : null;
    },
  },
];

const RECOMMENDED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "place_type_id", label: "Tipo luogo" },
  { key: "short_description_it", label: "Descrizione breve IT" },
  { key: "cover_image_url", label: "Immagine di copertina" },
];

const toArray = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    if (v.trim().startsWith("[") && v.trim().endsWith("]")) {
      try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch { }
    }
    return v.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const toTextarea = (v: any): string => {
  const arr = toArray(v);
  return arr.length > 0 ? arr.join("\n") : "";
};

const toArrayComma = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

function CollapsibleSection({
  title, color, defaultOpen = false, children,
}: { title: string; color: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#E9DCC4] rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#F9F4EC] hover:bg-[#F0E8D6] transition-colors text-left"
      >
        <span className={cn("w-1 h-5 rounded-full", color)} />
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-[#92816A]" /> : <ChevronRight className="w-4 h-4 text-[#92816A]" />}
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

function PlaceModal({
  open, onClose, edit, tt, pt, editTT, setEditTT,
  errors, touched, showWarnings, saving, onSubmit,
  updateField, markTouched, setShowWarnings, getMissingRecommended, errorBannerRef,
  setErrors,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lastSeenNameIt = useRef("");
  const lastSeenSubtitleIt = useRef("");
  const lastSeenShortDescIt = useRef("");
  const lastSeenFullDescIt = useRef("");
  const lastSeenHighlightsIt = useRef("");

  const [translatingName, setTranslatingName] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingSubtitle, setTranslatingSubtitle] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingShortDesc, setTranslatingShortDesc] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingFullDesc, setTranslatingFullDesc] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingHighlights, setTranslatingHighlights] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingTags, setTranslatingTags] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (open) {
      lastSeenNameIt.current = edit?.name_it || "";
      lastSeenSubtitleIt.current = edit?.subtitle_it || "";
      lastSeenShortDescIt.current = edit?.short_description_it || "";
      lastSeenFullDescIt.current = edit?.full_description_it || "";
      lastSeenHighlightsIt.current = toTextarea(edit?.highlights_it);
    }
  }, [open, edit?.id]);

  useEffect(() => {
    const valIT = edit?.name_it;
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenNameIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingName("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenNameIt.current = valIT;
        updateField("name_en", translated);
        setTranslatingName("success");
        setTimeout(() => setTranslatingName("idle"), 2000);
      } catch {
        setTranslatingName("error");
        setTimeout(() => setTranslatingName("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [edit?.name_it, open]);

  useEffect(() => {
    const valIT = edit?.subtitle_it;
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenSubtitleIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingSubtitle("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenSubtitleIt.current = valIT;
        updateField("subtitle_en", translated);
        setTranslatingSubtitle("success");
        setTimeout(() => setTranslatingSubtitle("idle"), 2000);
      } catch {
        setTranslatingSubtitle("error");
        setTimeout(() => setTranslatingSubtitle("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [edit?.subtitle_it, open]);

  useEffect(() => {
    const valIT = edit?.short_description_it;
    if (!open || !valIT || valIT.trim().length < 6 || valIT === lastSeenShortDescIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingShortDesc("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenShortDescIt.current = valIT;
        updateField("short_description_en", translated);
        setTranslatingShortDesc("success");
        setTimeout(() => setTranslatingShortDesc("idle"), 2000);
      } catch {
        setTranslatingShortDesc("error");
        setTimeout(() => setTranslatingShortDesc("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [edit?.short_description_it, open]);

  useEffect(() => {
    const valIT = edit?.full_description_it;
    if (!open || !valIT || valIT.trim().length < 8 || valIT === lastSeenFullDescIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingFullDesc("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenFullDescIt.current = valIT;
        updateField("full_description_en", translated);
        setTranslatingFullDesc("success");
        setTimeout(() => setTranslatingFullDesc("idle"), 2000);
      } catch {
        setTranslatingFullDesc("error");
        setTimeout(() => setTranslatingFullDesc("idle"), 3000);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [edit?.full_description_it, open]);

  useEffect(() => {
    const valIT = toTextarea(edit?.highlights_it);
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenHighlightsIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingHighlights("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenHighlightsIt.current = valIT;
        const lines = translated.split("\n").map((s) => s.trim()).filter(Boolean);
        updateField("highlights_en", lines);
        setTranslatingHighlights("success");
        setTimeout(() => setTranslatingHighlights("idle"), 2000);
      } catch {
        setTranslatingHighlights("error");
        setTimeout(() => setTranslatingHighlights("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [edit?.highlights_it, open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open && scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [open]);

  if (!open || !edit) return null;

  const inputClass = (key: string) => {
    const hasError = errors[key] && touched[key];
    return cn(
      "w-full px-3 py-2 text-sm border rounded-sm bg-white focus:outline-none focus:ring-2 transition-colors",
      hasError ? "border-[#B22A2A] focus:ring-[#B22A2A]/30" : "border-[#E9DCC4] focus:ring-[#4A6535]/30 focus:border-[#4A6535]"
    );
  };

  const translateTagsAction = async () => {
    const tagsIt = edit?.tags_it || [];
    if (tagsIt.length === 0) return;
    setTranslatingTags("loading");
    try {
      const textToTranslate = tagsIt.join(", ");
      const translated = await translateLongText(textToTranslate, "it", "en");
      const splitTags = translated.split(",").map((s: string) => s.trim()).filter(Boolean);
      updateField("tags_en", splitTags);
      setTranslatingTags("success");
      setTimeout(() => setTranslatingTags("idle"), 2000);
    } catch {
      setTranslatingTags("error");
      setTimeout(() => setTranslatingTags("idle"), 3000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E160A]/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={modalRef} className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">{edit.id ? "Modifica luogo" : "Nuovo luogo"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center text-[#7A6655]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body con scroll */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Banner errori */}
          {Object.keys(errors).length > 0 && (
            <div ref={errorBannerRef} className="flex items-start gap-3 p-4 bg-[#B22A2A]/10 border border-[#B22A2A]/30 rounded-sm">
              <AlertCircle className="w-5 h-5 text-[#9C1C1C] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#9C1C1C] mb-1">Completa i campi obbligatori</p>
                <ul className="text-xs text-[#9C1C1C]/90 space-y-0.5 list-disc list-inside">
                  {(Object.values(errors) as string[]).map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Banner warning */}
          {showWarnings && (
            <div className="flex items-start gap-3 p-4 bg-[#C4923A]/10 border border-[#C4923A]/30 rounded-sm">
              <Info className="w-5 h-5 text-[#B89200] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#8B6F00] mb-1">Campi consigliati mancanti</p>
                <p className="text-xs text-[#8B6F00]/90 mb-2">
                  Ti consigliamo di compilare: <strong>{getMissingRecommended(edit).join(", ")}</strong>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowWarnings(false)} className="px-3 py-1.5 text-xs font-medium bg-white text-[#3D2E1A] border border-[#E9DCC4] rounded-sm hover:bg-[#F9F4EC]">
                    Torna al form
                  </button>
                  <button type="button" onClick={() => onSubmit({ preventDefault: () => { } } as any, true)} className="px-3 py-1.5 text-xs font-medium bg-[#4A6535] text-white rounded-sm hover:bg-[#3A5228]">
                    Salva comunque
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sezione: Informazioni principali */}
          <CollapsibleSection title="Informazioni principali" color="bg-[#B22A2A]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Nome IT <span className="text-[#B22A2A]">*</span></>} error={errors.name_it && touched.name_it ? errors.name_it : undefined}>
                <input required className={inputClass("name_it")} value={edit.name_it || ""} onChange={(e) => updateField("name_it", e.target.value)} onBlur={() => markTouched("name_it")} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Nome EN <span className="text-[#B22A2A]">*</span></span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingName} />
                      <TranslateButton
                        sourceText={edit.name_it || ""}
                        onTranslated={(t) => {
                          lastSeenNameIt.current = edit.name_it || "";
                          updateField("name_en", t);
                        }}
                      />
                    </div>
                  </div>
                }
                error={errors.name_en && touched.name_en ? errors.name_en : undefined}
              >
                <input
                  required
                  className={inputClass("name_en")}
                  value={edit.name_en || ""}
                  onChange={(e) => {
                    updateField("name_en", e.target.value);
                  }}
                  onBlur={() => markTouched("name_en")}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Slug (URL)">
                <input className={inputClass("slug")} value={edit.slug || ""} onChange={(e) => updateField("slug", e.target.value)} placeholder="generato automaticamente se vuoto" />
              </Field>
              <Field label={<>Tipo luogo <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <select className={inputClass("place_type_id")} value={edit.place_type_id || ""} onChange={(e) => updateField("place_type_id", e.target.value || null)}>
                  <option value="">— Seleziona —</option>
                  {pt.map((p: any) => <option key={p.id} value={p.id}>{p.name_it}</option>)}
                </select>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Sottotitolo IT">
                <input className={inputClass("subtitle_it")} value={edit.subtitle_it || ""} onChange={(e) => updateField("subtitle_it", e.target.value)} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Sottotitolo EN</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingSubtitle} />
                      <TranslateButton
                        sourceText={edit.subtitle_it || ""}
                        onTranslated={(t) => {
                          lastSeenSubtitleIt.current = edit.subtitle_it || "";
                          updateField("subtitle_en", t);
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <input
                  className={inputClass("subtitle_en")}
                  value={edit.subtitle_en || ""}
                  onChange={(e) => {
                    updateField("subtitle_en", e.target.value);
                  }}
                />
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Descrizioni */}
          <CollapsibleSection title="Descrizioni e Contenuti" color="bg-[#4A6535]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Descrizione breve IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <textarea rows={3} className={cn(inputClass("short_description_it"), "resize-y")} value={edit.short_description_it || ""} onChange={(e) => updateField("short_description_it", e.target.value)} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Descrizione breve EN</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingShortDesc} />
                      <TranslateButton
                        sourceText={edit.short_description_it || ""}
                        onTranslated={(t) => {
                          lastSeenShortDescIt.current = edit.short_description_it || "";
                          updateField("short_description_en", t);
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <textarea
                  rows={3}
                  className={cn(inputClass("short_description_en"), "resize-y")}
                  value={edit.short_description_en || ""}
                  onChange={(e) => {
                    updateField("short_description_en", e.target.value);
                  }}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Descrizione completa IT">
                <textarea rows={5} className={cn(inputClass("full_description_it"), "resize-y")} value={edit.full_description_it || ""} onChange={(e) => updateField("full_description_it", e.target.value)} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Descrizione completa EN</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingFullDesc} />
                      <TranslateButton
                        sourceText={edit.full_description_it || ""}
                        onTranslated={(t) => {
                          lastSeenFullDescIt.current = edit.full_description_it || "";
                          updateField("full_description_en", t);
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <textarea
                  rows={5}
                  className={cn(inputClass("full_description_en"), "resize-y")}
                  value={edit.full_description_en || ""}
                  onChange={(e) => {
                    updateField("full_description_en", e.target.value);
                  }}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Highlights IT (uno per riga)">
                <textarea rows={3} className={cn(inputClass("highlights_it"), "resize-y font-mono text-xs")} value={toTextarea(edit.highlights_it)} onChange={(e) => updateField("highlights_it", e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean))} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Highlights EN (uno per riga)</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingHighlights} />
                      <TranslateButton
                        sourceText={toTextarea(edit.highlights_it)}
                        onTranslated={(t) => {
                          lastSeenHighlightsIt.current = toTextarea(edit.highlights_it);
                          updateField("highlights_en", t.split("\n").map((s: string) => s.trim()).filter(Boolean));
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <textarea
                  rows={3}
                  className={cn(inputClass("highlights_en"), "resize-y font-mono text-xs")}
                  value={toTextarea(edit.highlights_en)}
                  onChange={(e) => {
                    updateField("highlights_en", e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean));
                  }}
                />
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Dettagli Operativi */}
          <CollapsibleSection title="Dettagli Operativi" color="bg-[#3D6E90]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Durata (ore) <span className="text-[#B22A2A]">*</span></>} error={errors.duration_hours && touched.duration_hours ? errors.duration_hours : undefined}>
                <input type="number" step="0.5" min={0.5} required className={inputClass("duration_hours")} value={edit.duration_hours ?? ""} onChange={(e) => updateField("duration_hours", Number(e.target.value) || null)} onBlur={() => markTouched("duration_hours")} />
              </Field>
              <Field label="Difficoltà">
                <select className={inputClass("difficulty")} value={edit.difficulty || "easy"} onChange={(e) => updateField("difficulty", e.target.value)}>
                  {DIFF.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
                </select>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Min partecipanti">
                <input type="number" min={1} className={inputClass("min_participants")} value={edit.min_participants ?? ""} onChange={(e) => updateField("min_participants", Number(e.target.value) || null)} />
              </Field>
              <Field label="Max partecipanti">
                <input type="number" min={1} className={inputClass("max_participants")} value={edit.max_participants ?? ""} onChange={(e) => updateField("max_participants", Number(e.target.value) || null)} />
              </Field>
            </Grid2>
            <Field
              label={<>Categorie Tour associate <span className="text-[#B22A2A]">*</span></>}
              error={errors.tour_types}
            >
              <div
                className={cn(
                  "grid sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-sm max-h-48 overflow-y-auto transition-colors",
                  errors.tour_types
                    ? "border-[#B22A2A] bg-[#B22A2A]/5"
                    : "border-[#E9DCC4] bg-[#F9F4EC]/50"
                )}
              >
                {tt.map((t: any) => {
                  const on = editTT.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-sm hover:bg-white text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          const next = on ? editTT.filter((x: string) => x !== t.id) : [...editTT, t.id];
                          setEditTT(next);
                          if (next.length > 0 && errors.tour_types) {
                            setErrors?.((prev: any) => {
                              const n = { ...prev };
                              delete n.tour_types;
                              return n;
                            });
                          }
                        }}
                        className="accent-[#4A6535]"
                      />
                      {t.name_it}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Trasporti disponibili">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border border-[#E9DCC4] rounded-sm bg-[#F9F4EC]/50">
                {TRANS.map((tx) => (
                  <label key={tx} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-[#4A6535]"
                      checked={(edit.transport_options || []).includes(tx)}
                      onChange={(e) => {
                        const cur = edit.transport_options || [];
                        updateField("transport_options", e.target.checked ? [...cur, tx] : cur.filter((x: string) => x !== tx));
                      }} />
                    {tx === "walk" ? "A piedi" : tx === "bike" ? "Bici" : tx === "moto" ? "Moto" : "Bus"}
                  </label>
                ))}
              </div>
            </Field>
          </CollapsibleSection>

          {/* Sezione: Posizione e Tag */}
          <CollapsibleSection title="Posizione e Tag" color="bg-[#8B6F47]" defaultOpen={false}>
            <Field label="Indirizzo / Posizione">
              <input className={inputClass("location_address")} value={edit.location_address || ""} onChange={(e) => updateField("location_address", e.target.value)} placeholder="Es. Piazza Bra, Verona" />
            </Field>
            <Grid2>
              <Field label="Tag IT (separati da virgola)">
                <TagInput
                  tags={Array.isArray(edit.tags_it) ? edit.tags_it : []}
                  onChange={(newTags) => updateField("tags_it", newTags)}
                  placeholder="Scrivi e premi virgola o invio..."
                />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Tag EN (separati da virgola)</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingTags} />
                      <TranslateButton
                        sourceText={Array.isArray(edit.tags_it) ? edit.tags_it.join(", ") : ""}
                        onTranslated={(t) => {
                          const splitTags = t.split(",").map((s: string) => s.trim()).filter(Boolean);
                          updateField("tags_en", splitTags);
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <TagInput
                  tags={Array.isArray(edit.tags_en) ? edit.tags_en : []}
                  onChange={(newTags) => updateField("tags_en", newTags)}
                  placeholder="Write and press comma or enter..."
                />
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Impostazioni */}
          <CollapsibleSection title="Impostazioni" color="bg-[#92816A]" defaultOpen={false}>
            <Grid2>
              <Field label="URL immagine copertina" hint={<>Lascia vuoto o usa <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <input className={inputClass("cover_image_url")} value={edit.cover_image_url || ""} onChange={(e) => updateField("cover_image_url", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Ordine di visualizzazione">
                <input type="number" className={inputClass("sort_order")} value={edit.sort_order ?? 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Attivo nel sito">
                <select className={inputClass("is_active")} value={edit.is_active ? "1" : "0"} onChange={(e) => updateField("is_active", e.target.value === "1")}>
                  <option value="1">Sì, visibile</option>
                  <option value="0">No, nascosto</option>
                </select>
              </Field>
              <Field label="In evidenza (Popolare)">
                <select className={inputClass("is_popular")} value={edit.is_popular ? "1" : "0"} onChange={(e) => updateField("is_popular", e.target.value === "1")}>
                  <option value="0">No</option>
                  <option value="1">Sì — mostra badge</option>
                </select>
              </Field>
            </Grid2>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9DCC4] bg-[#F9F4EC]">
          <div className="flex items-center gap-1.5 text-xs text-[#7A6655]">
            <span className="text-[#B22A2A] font-bold">*</span> <span>obbligatori</span>
            <span className="mx-2 text-[#C4B49A]">|</span>
            <span className="text-[#C4923A] font-bold">consigliati</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-sm text-sm font-medium text-[#5C4C38] hover:bg-[#E9DCC4]">Annulla</button>
            <button type="button" onClick={(e) => onSubmit(e as any, false)} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-[#4A6535] text-white rounded-sm text-sm font-medium hover:bg-[#3A5228] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {edit.id ? "Aggiorna luogo" : "Crea luogo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PlacesPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tt, setTt] = useState<TT[]>([]);
  const [pt, setPt] = useState<PT[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [editTT, setEditTT] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showWarnings, setShowWarnings] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: t }, { data: y }] = await Promise.all([
      supabase.from("places").select("*, place_type:place_types!places_place_type_id_fkey(name_it,name_en), place_tour_types(tour_type_id)").order("sort_order"),
      supabase.from("tour_types").select("id, name_it, name_en").eq("is_active", true),
      supabase.from("place_types").select("id, name_it, name_en").order("name_it"),
    ]);
    setRows(p ?? []); setTt(t ?? []); setPt(y ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF, sort_order: rows.length });
    setEditTT([]);
    setErrors({}); setTouched({}); setShowWarnings(false);
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    setEdit({
      ...r,
      highlights_it: toArray(r.highlights_it),
      highlights_en: toArray(r.highlights_en),
      tags_it: toArrayComma(r.tags_it),
      tags_en: toArrayComma(r.tags_en),
    });
    setEditTT(r.place_tour_types?.map((x: any) => x.tour_type_id) || []);
    setErrors({}); setTouched({}); setShowWarnings(false);
    setOpen(true);
  };

  const validate = (data: Row): Record<string, string> => {
    const errs: Record<string, string> = {};
    REQUIRED_FIELDS.forEach((f) => {
      const err = f.validate(data[f.key]);
      if (err) errs[f.key] = err;
    });
    return errs;
  };

  const getMissingRecommended = (data: Row): string[] => {
    return RECOMMENDED_FIELDS.filter((f) => {
      const v = data[f.key];
      if (f.key === "short_description_it") return !v || String(v).trim().length < 10;
      return !v;
    }).map((f) => f.label);
  };

  const updateField = (key: string, value: any) => {
    const newData = { ...edit, [key]: value } as Row;
    setEdit(newData);
    setTouched((t) => ({ ...t, [key]: true }));
    const field = REQUIRED_FIELDS.find((f) => f.key === key);
    if (field) {
      const err = field.validate(value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[key] = err;
        else delete next[key];
        return next;
      });
    }
  };

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const onSubmit = async (e: React.FormEvent, forceSave = false) => {
    e.preventDefault();
    if (!edit) return;

    const allTouched: Record<string, boolean> = {};
    REQUIRED_FIELDS.forEach((f) => (allTouched[f.key] = true));
    setTouched(allTouched);

    const validationErrors = validate(edit);
    if (!editTT || editTT.length === 0) {
      validationErrors.tour_types = "Devi associare almeno una Categoria Tour";
    }
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }

    const missing = getMissingRecommended(edit);
    if (missing.length > 0 && !forceSave && !showWarnings) {
      setShowWarnings(true);
      return;
    }

    setSaving(true);
    try {
      const id = edit.id || crypto.randomUUID();
      const { place_type, place_tour_types, ...restOfEdit } = edit;

      const payload = {
        ...restOfEdit,
        id,
        slug: edit.slug || String(edit.name_it).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        sort_order: Number(edit.sort_order ?? 0),
        min_participants: edit.min_participants || null,
        max_participants: edit.max_participants || null,
      };

      const { error } = await supabase.from("places").upsert(payload as any, { onConflict: "id" });
      if (error) throw error;

      if (edit.id) await supabase.from("place_tour_types").delete().eq("place_id", id);
      if (editTT.length > 0) {
        const { error: err2 } = await supabase.from("place_tour_types").insert(
          editTT.map((ttid) => ({ place_id: id, tour_type_id: ttid })) as any
        );
        if (err2) throw err2;
      }
      notify("success", "Luogo salvato");
      setOpen(false); load();
    } catch (e: any) { notify("error", e.message); }
    finally { setSaving(false); }
  };

  const onDelete = async (r: Row) => {
    if (!confirm("Eliminare questo luogo in modo permanente?")) return;
    const { error } = await supabase.from("places").delete().eq("id", r.id);
    if (error) notify("error", error.message);
    else { notify("success", "Luogo eliminato"); load(); }
  };

  const unassignedCount = rows.filter((r) => !r.place_tour_types || r.place_tour_types.length === 0).length;
  const displayedRows = filterUnassigned
    ? rows.filter((r) => !r.place_tour_types || r.place_tour_types.length === 0)
    : rows;

  return (
    <PageHeader
      title="Luoghi / Destinazioni"
      subtitle="Gestisci le mete, le città d'arte, le ville e i monumenti del sito"
      icon={<MapIcon className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come gestire i Luoghi e gli Itinerari"
        description="I Luoghi rappresentano i singoli punti di interesse e destinazioni mostrati nelle schede tour del sito pubblico."
        badge="Guida Luoghi"
        steps={[
          { title: "1. Crea o Modifica Luoghi", description: "Inserisci titolo IT/EN, descrizione breve, durata consigliata e una foto di copertina ad alta risoluzione.", badge: "Scheda Luogo" },
          { title: "2. Associa Categorie Tour", description: "Collega il luogo ad almeno una Categoria Tour: è obbligatorio per farlo apparire nelle sezioni corrette del sito.", badge: "Collegamento" },
          { title: "3. Difficoltà e Trasporti", description: "Indica se la visita è adatta a famiglie, a piedi, in bici o in moto per aiutare i visitatori a scegliere.", badge: "Dettagli" },
        ]}
        tips={["Se vuoi che un luogo appaia nella sezione serale 'Esperienze Esclusive', collegalo a una Categoria contrassegnata come 'Esclusiva'."]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-[#7A6655]">{rows.length} luoghi salvati</p>
            {unassignedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterUnassigned(!filterUnassigned)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold transition-all border shadow-sm cursor-pointer",
                  filterUnassigned
                    ? "bg-[#B22A2A] text-white border-[#B22A2A]"
                    : "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300"
                )}
                title="Filtra per mostrare solo i luoghi senza categoria"
              >
                <AlertTriangle className={cn("w-3.5 h-3.5", filterUnassigned ? "text-white" : "text-amber-700")} />
                <span>{unassignedCount} da correggere (senza categoria)</span>
                {filterUnassigned && <span className="ml-1 text-[10px] underline">(mostra tutti)</span>}
              </button>
            )}
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C] shrink-0">
            <Plus className="w-4 h-4" /> Nuovo luogo
          </button>
        </div>
        {loading ? null : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessun luogo ancora</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-[#F9F4EC] text-[#5C4C38] text-xs uppercase tracking-wider">
                <tr>
                  <th className="w-[40%] px-5 py-3 text-left font-semibold">Luogo</th>
                  <th className="w-[18%] px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="w-[22%] px-4 py-3 text-left font-semibold">Categorie Tour</th>
                  <th className="w-[12%] px-4 py-3 text-left font-semibold whitespace-nowrap">Stato</th>
                  <th className="w-[8%] min-w-[76px] px-5 py-3 text-right font-semibold whitespace-nowrap">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8D6]">
                {displayedRows.map((r) => {
                  const desc = r.subtitle_it || r.short_description_it || r.name_en;
                  const hasNoCategory = !r.place_tour_types || r.place_tour_types.length === 0;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "hover:bg-[#F9F4EC]/60 transition-colors",
                        hasNoCategory && "bg-amber-50/50"
                      )}
                    >
                      <td className="px-5 py-3.5 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          {r.cover_image_url ? (
                            <div className="relative w-12 h-12 rounded-sm overflow-hidden shrink-0 bg-[#F0E8D6]">
                              <Image src={r.cover_image_url} alt="" fill sizes="48px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-sm bg-[#F0E8D6] flex items-center justify-center shrink-0 text-[#92816A]">
                              <Eye className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-[#1E160A] truncate" title={r.name_it}>
                                {r.name_it}
                              </p>
                              {hasNoCategory && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-wider"
                                  title="Questo luogo non ha alcuna categoria tour assegnata"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700" /> Da correggere
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7A6655] truncate" title={desc}>
                              {desc}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#5C4C38] text-xs leading-snug">
                        <span className="line-clamp-2">{r.place_type?.name_it || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {r.place_tour_types?.map((x: any) => {
                            const t = tt.find((y: any) => y.id === x.tour_type_id);
                            if (!t) return null;
                            return (
                              <span
                                key={t.id}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#3D6E90]/10 text-[#244D68] border border-[#3D6E90]/20 rounded-sm"
                              >
                                {t.name_it}
                              </span>
                            );
                          })}
                          {hasNoCategory && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                              Da associare
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {r.is_active ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#4A6535]/15 text-[#3A5228] rounded-sm">
                              Attivo
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F0E8D6] text-[#7A6655] rounded-sm">
                              Disattivo
                            </span>
                          )}
                          {r.is_popular && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#B22A2A]/10 text-[#9C1C1C] rounded-sm">
                              Popolare
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38] flex items-center justify-center transition-colors"
                            title="Modifica"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(r)}
                            className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlaceModal
        open={open}
        onClose={() => setOpen(false)}
        edit={edit}
        tt={tt}
        pt={pt}
        editTT={editTT}
        setEditTT={setEditTT}
        errors={errors}
        setErrors={setErrors}
        touched={touched}
        showWarnings={showWarnings}
        saving={saving}
        onSubmit={onSubmit}
        updateField={updateField}
        markTouched={markTouched}
        setShowWarnings={setShowWarnings}
        getMissingRecommended={getMissingRecommended}
        errorBannerRef={errorBannerRef}
      />
    </PageHeader>
  );
}