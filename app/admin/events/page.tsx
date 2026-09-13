"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import TranslateButton from "@/components/admin/TranslateButton";
import {
  CalendarDays, Plus, Edit2, Trash2, Loader2,
  Users, MapPin, AlertCircle, CheckCircle2, Info,
  ChevronDown, ChevronRight, X, Languages, AlertTriangle,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDate } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";
import { translateLongText } from "@/lib/translateClient";

type Row = any;
type TT = any;
type PL = any;

function AutoTranslateBadge({ state }: { state: "idle" | "loading" | "success" | "error" }) {
  if (state === "idle") return null;
  const map = {
    loading: { cls: "text-[#3D6E90] bg-[#3D6E90]/10", Icon: Loader2, spin: true, label: "Traduzione..." },
    success: { cls: "text-[#4A6535] bg-[#4A6535]/10", Icon: CheckCircle2, spin: false, label: "Tradotto ✓" },
    error: { cls: "text-[#9C1C1C] bg-[#9C1C1C]/10", Icon: AlertCircle, spin: false, label: "Errore" },
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
  id: null, tour_type_id: null,
  title_it: "", title_en: "", subtitle_it: "", subtitle_en: "",
  description_it: "", description_en: "",
  start_date: "", end_date: null, meeting_point_it: "", meeting_point_en: "",
  duration_hours: 4, max_seats: 20, booked_seats: 0,
  price_euro: null, status: "open", difficulty: "easy",
  included_it: [], included_en: [], to_bring_it: [], to_bring_en: [],
  sort_order: 0, is_active: true, is_featured: false,
};

const STATUSES = [
  { v: "open", l: "Aperto", c: "bg-[#4A6535]/15 text-[#3A5228] border-[#4A6535]/30" },
  { v: "last_places", l: "Ultimi posti", c: "bg-[#B22A2A]/15 text-[#9C1C1C] border-[#B22A2A]/30" },
  { v: "full", l: "Tutto esaurito", c: "bg-[#E9DCC4] text-[#3D2E1A] border-[#C4B49A]" },
  { v: "closed", l: "Chiuso", c: "bg-[#F0E8D6] text-[#7A6655] border-[#E9DCC4]" },
];

const DIFFICULTIES = [
  { v: "easy", l: "Facile", d: "Adatto a tutti, percorso pianeggiante" },
  { v: "moderate", l: "Media", d: "Richiede una minima forma fisica" },
  { v: "challenging", l: "Impegnativa", d: "Percorsi con dislivelli o lunga durata" },
];

const REQUIRED_FIELDS: Array<{
  key: string;
  label: string;
  validate: (v: any) => string | null;
}> = [
    {
      key: "title_it",
      label: "Titolo in italiano",
      validate: (v) => !v || String(v).trim().length < 3 ? "Inserisci un titolo in italiano (min. 3 caratteri)" : null,
    },
    {
      key: "title_en",
      label: "Titolo in inglese",
      validate: (v) => !v || String(v).trim().length < 3 ? "Inserisci un titolo in inglese (min. 3 caratteri)" : null,
    },
    {
      key: "start_date",
      label: "Data di inizio",
      validate: (v) => {
        if (!v) return "Seleziona una data e ora di inizio";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "Data non valida";
        return null;
      },
    },
    {
      key: "tour_type_id",
      label: "Categoria tour",
      validate: (v) => (!v || String(v).trim().length === 0 ? "Seleziona una categoria di tour" : null),
    },
    {
      key: "max_seats",
      label: "Posti totali",
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 1) return "Inserisci almeno 1 posto disponibile";
        return null;
      },
    },
    {
      key: "duration_hours",
      label: "Durata",
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0) return "Inserisci una durata valida";
        return null;
      },
    },
  ];

const RECOMMENDED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "meeting_point_it", label: "Punto d'incontro (IT)" },
  { key: "description_it", label: "Descrizione (IT)" },
];

const toArray = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    if (v.trim().startsWith("[") && v.trim().endsWith("]")) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch { }
    }
    return v.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const toTextarea = (v: any): string => {
  const arr = toArray(v);
  return arr.length > 0 ? arr.join("\n") : "";
};

function CollapsibleSection({
  title,
  icon,
  color,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#E9DCC4] rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#F9F4EC] hover:bg-[#F0E8D6] transition-colors text-left"
      >
        <span className={cn("w-1 h-5 rounded-full", color)} />
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">
          {title}
        </span>
        {icon}
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[#92816A]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#92816A]" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

function EventModal({
  open,
  onClose,
  edit,
  tt,
  places,
  selPlaces,
  setSelPlaces,
  errors,
  touched,
  showWarnings,
  saving,
  onSubmit,
  updateField,
  markTouched,
  setShowWarnings,
  getMissingRecommended,
  errorBannerRef,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Riferimenti all'ultimo valore IT tradotto/visto (per evitare loop e tradurre appena l'utente modifica IT)
  const lastSeenTitleIt = useRef("");
  const lastSeenSubtitleIt = useRef("");
  const lastSeenMeetingPointIt = useRef("");
  const lastSeenDescriptionIt = useRef("");
  const lastSeenIncludedIt = useRef("");
  const lastSeenToBringIt = useRef("");

  // Stati dei badge di caricamento traduzione
  const [translatingTitle, setTranslatingTitle] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingSubtitle, setTranslatingSubtitle] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingMeetingPoint, setTranslatingMeetingPoint] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingDescription, setTranslatingDescription] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingIncluded, setTranslatingIncluded] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingToBring, setTranslatingToBring] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Inizializzazione lastSeen all'apertura del modale
  useEffect(() => {
    if (open) {
      lastSeenTitleIt.current = edit?.title_it || "";
      lastSeenSubtitleIt.current = edit?.subtitle_it || "";
      lastSeenMeetingPointIt.current = edit?.meeting_point_it || "";
      lastSeenDescriptionIt.current = edit?.description_it || "";
      lastSeenIncludedIt.current = toTextarea(edit?.included_it);
      lastSeenToBringIt.current = toTextarea(edit?.to_bring_it);
    }
  }, [open, edit?.id]);

  // 1. AUTO-TRANSLATE: TITOLO (IT -> EN)
  useEffect(() => {
    const valIT = edit?.title_it;
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenTitleIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingTitle("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenTitleIt.current = valIT;
        updateField("title_en", translated);
        setTranslatingTitle("success");
        setTimeout(() => setTranslatingTitle("idle"), 2000);
      } catch {
        setTranslatingTitle("error");
        setTimeout(() => setTranslatingTitle("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [edit?.title_it, open]);

  // 2. AUTO-TRANSLATE: SOTTOTITOLO (IT -> EN)
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

  // 3. AUTO-TRANSLATE: PUNTO D'INCONTRO (IT -> EN)
  useEffect(() => {
    const valIT = edit?.meeting_point_it;
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenMeetingPointIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingMeetingPoint("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenMeetingPointIt.current = valIT;
        updateField("meeting_point_en", translated);
        setTranslatingMeetingPoint("success");
        setTimeout(() => setTranslatingMeetingPoint("idle"), 2000);
      } catch {
        setTranslatingMeetingPoint("error");
        setTimeout(() => setTranslatingMeetingPoint("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [edit?.meeting_point_it, open]);

  // 4. AUTO-TRANSLATE: DESCRIZIONE (IT -> EN)
  useEffect(() => {
    const valIT = edit?.description_it;
    if (!open || !valIT || valIT.trim().length < 8 || valIT === lastSeenDescriptionIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingDescription("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenDescriptionIt.current = valIT;
        updateField("description_en", translated);
        setTranslatingDescription("success");
        setTimeout(() => setTranslatingDescription("idle"), 2000);
      } catch {
        setTranslatingDescription("error");
        setTimeout(() => setTranslatingDescription("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [edit?.description_it, open]);

  // 5. AUTO-TRANSLATE: INCLUSO (IT -> EN)
  useEffect(() => {
    const valIT = toTextarea(edit?.included_it);
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenIncludedIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingIncluded("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenIncludedIt.current = valIT;
        const lines = translated.split("\n").map(s => s.trim()).filter(Boolean);
        updateField("included_en", lines);
        setTranslatingIncluded("success");
        setTimeout(() => setTranslatingIncluded("idle"), 2000);
      } catch {
        setTranslatingIncluded("error");
        setTimeout(() => setTranslatingIncluded("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [JSON.stringify(edit?.included_it), open]);

  // 6. AUTO-TRANSLATE: DA PORTARE (IT -> EN)
  useEffect(() => {
    const valIT = toTextarea(edit?.to_bring_it);
    if (!open || !valIT || valIT.trim().length < 2 || valIT === lastSeenToBringIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingToBring("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenToBringIt.current = valIT;
        const lines = translated.split("\n").map(s => s.trim()).filter(Boolean);
        updateField("to_bring_en", lines);
        setTranslatingToBring("success");
        setTimeout(() => setTranslatingToBring("idle"), 2000);
      } catch {
        setTranslatingToBring("error");
        setTimeout(() => setTranslatingToBring("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [JSON.stringify(edit?.to_bring_it), open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open || !edit) return null;

  const inputClass = (key: string) => {
    const hasError = errors[key] && touched[key];
    return cn(
      "w-full px-3 py-2 text-sm border rounded-sm bg-white focus:outline-none focus:ring-2 transition-colors",
      hasError
        ? "border-[#B22A2A] focus:ring-[#B22A2A]/30"
        : "border-[#E9DCC4] focus:ring-[#4A6535]/30 focus:border-[#4A6535]"
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1E160A]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">
            {edit.id ? "Modifica evento" : "Nuovo evento"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center text-[#7A6655]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {Object.keys(errors).length > 0 && (
            <div
              ref={errorBannerRef}
              className="flex items-start gap-3 p-4 bg-[#B22A2A]/10 border border-[#B22A2A]/30 rounded-sm"
            >
              <AlertCircle className="w-5 h-5 text-[#9C1C1C] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#9C1C1C] mb-1">
                  Completa i campi obbligatori
                </p>
                <ul className="text-xs text-[#9C1C1C]/90 space-y-0.5 list-disc list-inside">
                  {(Object.values(errors) as string[]).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showWarnings && (
            <div className="flex items-start gap-3 p-4 bg-[#C4923A]/10 border border-[#C4923A]/30 rounded-sm">
              <Info className="w-5 h-5 text-[#B89200] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#8B6F00] mb-1">
                  Campi consigliati mancanti
                </p>
                <p className="text-xs text-[#8B6F00]/90 mb-2">
                  L'evento può essere salvato, ma ti consigliamo di compilare:{" "}
                  <strong>{getMissingRecommended(edit).join(", ")}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWarnings(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-white text-[#3D2E1A] border border-[#E9DCC4] rounded-sm hover:bg-[#F9F4EC]"
                  >
                    Torna al form
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmit({ preventDefault: () => { } } as any, true)}
                    className="px-3 py-1.5 text-xs font-medium bg-[#4A6535] text-white rounded-sm hover:bg-[#3A5228]"
                  >
                    Salva comunque
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sezione: Informazioni principali */}
          <CollapsibleSection
            title="Informazioni principali"
            color="bg-[#B22A2A]"
            defaultOpen={true}
          >
            <Grid2>
              <Field
                label={<>Titolo in italiano <span className="text-[#B22A2A]">*</span></>}
                hint="Minimo 3 caratteri"
                error={errors.title_it && touched.title_it ? errors.title_it : undefined}
              >
                <input
                  required
                  className={inputClass("title_it")}
                  value={edit.title_it || ""}
                  onChange={(e) => updateField("title_it", e.target.value)}
                  onBlur={() => markTouched("title_it")}
                  placeholder="Es. Visita guidata a Verona"
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Titolo in inglese <span className="text-[#B22A2A]">*</span></span>
                    <AutoTranslateBadge state={translatingTitle} />
                  </span>
                }
                hint="Minimo 3 caratteri"
                error={errors.title_en && touched.title_en ? errors.title_en : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    required
                    className={inputClass("title_en")}
                    value={edit.title_en || ""}
                    onChange={(e) => {
                      updateField("title_en", e.target.value);
                    }}
                    onBlur={() => markTouched("title_en")}
                    placeholder="e.g. Guided tour of Verona"
                  />
                  <TranslateButton
                    sourceText={edit.title_it}
                    onTranslated={(t) => {
                      lastSeenTitleIt.current = edit.title_it || "";
                      updateField("title_en", t);
                    }}
                    size="sm"
                  />
                </div>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Sottotitolo IT" hint="Breve descrizione (opzionale)">
                <input
                  className={inputClass("subtitle_it")}
                  value={edit.subtitle_it || ""}
                  onChange={(e) => updateField("subtitle_it", e.target.value)}
                  placeholder="Es. Un viaggio tra storia e cultura"
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Sottotitolo EN</span>
                    <AutoTranslateBadge state={translatingSubtitle} />
                  </span>
                }
              >
                <div className="flex items-center gap-1.5">
                  <input
                    className={inputClass("subtitle_en")}
                    value={edit.subtitle_en || ""}
                    onChange={(e) => {
                      updateField("subtitle_en", e.target.value);
                    }}
                    placeholder="e.g. A journey through history"
                  />
                  <TranslateButton
                    sourceText={edit.subtitle_it}
                    onTranslated={(t) => {
                      lastSeenSubtitleIt.current = edit.subtitle_it || "";
                      updateField("subtitle_en", t);
                    }}
                    size="sm"
                  />
                </div>
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Data e luogo */}
          <CollapsibleSection
            title="Data e luogo"
            color="bg-[#4A6535]"
            defaultOpen={true}
          >
            <Grid2>
              <Field
                label={<>Data e ora inizio <span className="text-[#B22A2A]">*</span></>}
                error={errors.start_date && touched.start_date ? errors.start_date : undefined}
              >
                <input
                  type="datetime-local"
                  required
                  className={inputClass("start_date")}
                  value={(edit.start_date || "").slice(0, 16)}
                  onChange={(e) =>
                    updateField(
                      "start_date",
                      e.target.value ? new Date(e.target.value).toISOString() : ""
                    )
                  }
                  onBlur={() => markTouched("start_date")}
                />
              </Field>
              <Field
                label="Data e ora fine"
                hint="Lascia vuoto se non applicabile"
                error={errors.end_date && touched.end_date ? errors.end_date : undefined}
              >
                <input
                  type="datetime-local"
                  className={inputClass("end_date")}
                  value={(edit.end_date || "").slice(0, 16)}
                  onChange={(e) =>
                    updateField(
                      "end_date",
                      e.target.value ? new Date(e.target.value).toISOString() : null
                    )
                  }
                  onBlur={() => markTouched("end_date")}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field
                label={<>Punto d'incontro IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}
              >
                <input
                  className={inputClass("meeting_point_it")}
                  value={edit.meeting_point_it || ""}
                  onChange={(e) => updateField("meeting_point_it", e.target.value)}
                  placeholder="Es. Piazza Bra, di fronte alla Fontana"
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Punto d'incontro EN</span>
                    <AutoTranslateBadge state={translatingMeetingPoint} />
                  </span>
                }
              >
                <div className="flex items-center gap-1.5">
                  <input
                    className={inputClass("meeting_point_en")}
                    value={edit.meeting_point_en || ""}
                    onChange={(e) => {
                      updateField("meeting_point_en", e.target.value);
                    }}
                    placeholder="e.g. Piazza Bra, in front of the Fountain"
                  />
                  <TranslateButton
                    sourceText={edit.meeting_point_it}
                    onTranslated={(t) => {
                      lastSeenMeetingPointIt.current = edit.meeting_point_it || "";
                      updateField("meeting_point_en", t);
                    }}
                    size="sm"
                  />
                </div>
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Dettagli e disponibilità */}
          <CollapsibleSection
            title="Dettagli e disponibilità"
            color="bg-[#3D6E90]"
            defaultOpen={true}
          >
            <Grid2>
              <Field
                label={<>Categoria tour <span className="text-[#B22A2A]">*</span></>}
                error={errors.tour_type_id && touched.tour_type_id ? errors.tour_type_id : undefined}
              >
                <select
                  required
                  className={inputClass("tour_type_id")}
                  value={edit.tour_type_id || ""}
                  onChange={(e) => updateField("tour_type_id", e.target.value || null)}
                  onBlur={() => markTouched("tour_type_id")}
                >
                  <option value="">— Seleziona una categoria obbligatoria —</option>
                  {tt.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name_it}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stato">
                <select
                  className={inputClass("status")}
                  value={edit.status || "open"}
                  onChange={(e) => updateField("status", e.target.value as any)}
                >
                  {STATUSES.map((s: any) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid2>
            <Grid2>
              <Field
                label={<>Posti totali <span className="text-[#B22A2A]">*</span></>}
                hint="Numero massimo di partecipanti"
                error={errors.max_seats && touched.max_seats ? errors.max_seats : undefined}
              >
                <input
                  type="number"
                  min={1}
                  required
                  className={inputClass("max_seats")}
                  value={edit.max_seats ?? ""}
                  onChange={(e) => updateField("max_seats", Number(e.target.value) || null)}
                  onBlur={() => markTouched("max_seats")}
                />
              </Field>
              <Field
                label="Posti già prenotati"
                error={errors.booked_seats && touched.booked_seats ? errors.booked_seats : undefined}
                hint={`Disponibili: ${Math.max(0, (edit.max_seats || 0) - (edit.booked_seats || 0))}`}
              >
                <input
                  type="number"
                  min={0}
                  className={inputClass("booked_seats")}
                  value={edit.booked_seats ?? 0}
                  onChange={(e) => updateField("booked_seats", Number(e.target.value) || 0)}
                  onBlur={() => markTouched("booked_seats")}
                />
              </Field>
            </Grid2>
            <Grid2>
              <Field
                label="Durata (ore)"
                hint="Es. 2.5 per 2 ore e mezza"
                error={errors.duration_hours && touched.duration_hours ? errors.duration_hours : undefined}
              >
                <input
                  type="number"
                  step="0.5"
                  min={0.5}
                  required
                  className={inputClass("duration_hours")}
                  value={edit.duration_hours ?? ""}
                  onChange={(e) => updateField("duration_hours", Number(e.target.value) || null)}
                  onBlur={() => markTouched("duration_hours")}
                />
              </Field>
              <Field label="Difficoltà">
                <select
                  className={inputClass("difficulty")}
                  value={edit.difficulty || "easy"}
                  onChange={(e) => updateField("difficulty", e.target.value as any)}
                >
                  {DIFFICULTIES.map((d: any) => (
                    <option key={d.v} value={d.v}>
                      {d.l} — {d.d}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Prezzo €" hint="Lascia vuoto se variabile o da concordare">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputClass("price_euro")}
                  value={edit.price_euro ?? ""}
                  onChange={(e) =>
                    updateField("price_euro", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Luoghi / Tappe" hint="Seleziona i luoghi dell'itinerario">
                <div className="p-3 border border-[#E9DCC4] rounded-sm max-h-48 overflow-y-auto space-y-1.5 bg-[#F9F4EC]/50">
                  {places.length === 0 ? (
                    <p className="text-xs text-[#92816A] italic">
                      Nessun luogo disponibile. Aggiungili dalla sezione Luoghi.
                    </p>
                  ) : (
                    places.map((p: any) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm cursor-pointer px-1.5 py-0.5 rounded-sm hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          className="accent-[#4A6535]"
                          checked={selPlaces.includes(p.id)}
                          onChange={(e) =>
                            setSelPlaces(
                              e.target.checked
                                ? [...selPlaces, p.id]
                                : selPlaces.filter((x: string) => x !== p.id)
                            )
                          }
                        />
                        <span className="flex-1">{p.name_it}</span>
                        {p.name_en && p.name_en !== p.name_it && (
                          <span className="text-[10px] text-[#92816A] italic">
                            {p.name_en}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Descrizioni */}
          <CollapsibleSection
            title="Descrizioni e contenuti"
            color="bg-[#8B6F47]"
            defaultOpen={false}
          >
            <Grid2>
              <Field
                label={<>Descrizione IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato, min. 20 caratteri)</span></>}
                hint={`${(edit.description_it || "").length} caratteri`}
              >
                <textarea
                  rows={4}
                  className={cn(inputClass("description_it"), "resize-y")}
                  value={edit.description_it || ""}
                  onChange={(e) => updateField("description_it", e.target.value)}
                  placeholder="Descrivi l'esperienza, cosa vedranno i partecipanti..."
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Descrizione EN</span>
                    <AutoTranslateBadge state={translatingDescription} />
                  </span>
                }
              >
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    className={cn(inputClass("description_en"), "resize-y")}
                    value={edit.description_en || ""}
                    onChange={(e) => {
                      updateField("description_en", e.target.value);
                    }}
                    placeholder="Describe the experience..."
                  />
                  <div className="flex justify-end">
                    <TranslateButton
                      sourceText={edit.description_it}
                      onTranslated={(t) => {
                        lastSeenDescriptionIt.current = edit.description_it || "";
                        updateField("description_en", t);
                      }}
                      size="sm"
                    />
                  </div>
                </div>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Incluso IT" hint="Un elemento per riga">
                <textarea
                  rows={3}
                  className={cn(inputClass("included_it"), "resize-y font-mono text-xs")}
                  value={toTextarea(edit.included_it)}
                  onChange={(e) =>
                    updateField(
                      "included_it",
                      e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder={"Guida autorizzata\nAssicurazione\nAcqua"}
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Incluso EN</span>
                    <AutoTranslateBadge state={translatingIncluded} />
                  </span>
                }
                hint="Un elemento per riga"
              >
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    className={cn(inputClass("included_en"), "resize-y font-mono text-xs")}
                    value={toTextarea(edit.included_en)}
                    onChange={(e) => {
                      updateField(
                        "included_en",
                        e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean)
                      );
                    }}
                    placeholder={"Licensed guide\nInsurance\nWater"}
                  />
                  <div className="flex justify-end">
                    <TranslateButton
                      sourceText={toTextarea(edit.included_it)}
                      onTranslated={(t) => {
                        lastSeenIncludedIt.current = toTextarea(edit.included_it);
                        updateField(
                          "included_en",
                          t.split("\n").map((s: string) => s.trim()).filter(Boolean)
                        );
                      }}
                      size="sm"
                    />
                  </div>
                </div>
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Da portare IT" hint="Un elemento per riga">
                <textarea
                  rows={3}
                  className={cn(inputClass("to_bring_it"), "resize-y font-mono text-xs")}
                  value={toTextarea(edit.to_bring_it)}
                  onChange={(e) =>
                    updateField(
                      "to_bring_it",
                      e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder={"Scarpe comode\nAcqua\nCappello"}
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between w-full">
                    <span>Da portare EN</span>
                    <AutoTranslateBadge state={translatingToBring} />
                  </span>
                }
                hint="Un elemento per riga"
              >
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    className={cn(inputClass("to_bring_en"), "resize-y font-mono text-xs")}
                    value={toTextarea(edit.to_bring_en)}
                    onChange={(e) => {
                      updateField(
                        "to_bring_en",
                        e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean)
                      );
                    }}
                    placeholder={"Comfortable shoes\nWater\nHat"}
                  />
                  <div className="flex justify-end">
                    <TranslateButton
                      sourceText={toTextarea(edit.to_bring_it)}
                      onTranslated={(t) => {
                        lastSeenToBringIt.current = toTextarea(edit.to_bring_it);
                        updateField(
                          "to_bring_en",
                          t.split("\n").map((s: string) => s.trim()).filter(Boolean)
                        );
                      }}
                      size="sm"
                    />
                  </div>
                </div>
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Impostazioni */}
          <CollapsibleSection
            title="Impostazioni"
            color="bg-[#92816A]"
            defaultOpen={false}
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Attivo">
                <select
                  className={inputClass("is_active")}
                  value={edit.is_active ? "1" : "0"}
                  onChange={(e) => updateField("is_active", e.target.value === "1")}
                >
                  <option value="1">Sì, visibile sul sito</option>
                  <option value="0">No, nascosto</option>
                </select>
              </Field>
              <Field label="In evidenza">
                <select
                  className={inputClass("is_featured")}
                  value={edit.is_featured ? "1" : "0"}
                  onChange={(e) => updateField("is_featured", e.target.value === "1")}
                >
                  <option value="0">No</option>
                  <option value="1">Sì, mostra in homepage</option>
                </select>
              </Field>
              <Field label="Ordine di visualizzazione" hint="Numeri più bassi appaiono prima">
                <input
                  type="number"
                  className={inputClass("sort_order")}
                  value={edit.sort_order ?? 0}
                  onChange={(e) => updateField("sort_order", Number(e.target.value))}
                />
              </Field>
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer fisso */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9DCC4] bg-[#F9F4EC]">
          <div className="flex items-center gap-1.5 text-xs text-[#7A6655]">
            <span className="text-[#B22A2A] font-bold">*</span>
            <span>campi obbligatori</span>
            <span className="mx-2 text-[#C4B49A]">|</span>
            <span className="text-[#C4923A] font-bold"></span>
            <span>consigliati</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-sm font-medium text-[#5C4C38] hover:bg-[#E9DCC4]"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={(e) => onSubmit(e as any, false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#4A6535] text-white rounded-sm text-sm font-medium hover:bg-[#3A5228] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {edit.id ? "Aggiorna evento" : "Crea evento"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EventsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tt, setTt] = useState<TT[]>([]);
  const [places, setPlaces] = useState<PL[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [selPlaces, setSelPlaces] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showWarnings, setShowWarnings] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

const load = async () => {
  setLoading(true);
  try {
    const [e, t, p] = await Promise.all([
      // <--- INSERISCI QUI LA QUERY --->
      supabase
        .from("events")
        .select(`
          *,
          tour_type:tour_types(name_it, name_en, color),
          event_places (
            place_id,
            place:places(id, name_it, name_en)
          )
        `)
        .order("start_date"),
      supabase.from("tour_types").select("id,name_it,name_en,color").eq("is_active", true),
      supabase.from("places").select("id,name_it,name_en").eq("is_active", true),
    ]);

    setRows(e.data ?? []);
    setTt(t.data ?? []);
    setPlaces(p.data ?? []);
  } catch (err) {
    console.error("Errore caricamento:", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF });
    setSelPlaces([]);
    setErrors({});
    setTouched({});
    setShowWarnings(false);
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    setEdit({
      ...r,
      included_it: toArray(r.included_it),
      included_en: toArray(r.included_en),
      to_bring_it: toArray(r.to_bring_it),
      to_bring_en: toArray(r.to_bring_en),
    });
    setSelPlaces(r.event_places?.map((x: any) => x.place?.id).filter(Boolean) || []);
    setErrors({});
    setTouched({});
    setShowWarnings(false);
    setOpen(true);
  };

  const validate = (data: Row): Record<string, string> => {
    const errs: Record<string, string> = {};
    REQUIRED_FIELDS.forEach((f) => {
      const err = f.validate(data[f.key]);
      if (err) errs[f.key] = err;
    });

    if (data.start_date && data.end_date) {
      const s = new Date(data.start_date).getTime();
      const e = new Date(data.end_date).getTime();
      if (e <= s) {
        errs.end_date = "La data di fine deve essere successiva all'inizio";
      }
    }

    if (
      data.max_seats != null &&
      data.booked_seats != null &&
      Number(data.booked_seats) > Number(data.max_seats)
    ) {
      errs.booked_seats = "I posti prenotati non possono superare i posti totali";
    }

    return errs;
  };

  const getMissingRecommended = (data: Row): string[] => {
    return RECOMMENDED_FIELDS.filter((f) => {
      const v = data[f.key];
      if (f.key === "description_it") return !v || String(v).trim().length < 20;
      return !v;
    }).map((f) => f.label);
  };

  const updateField = (key: string, value: any) => {
    setEdit((prev: any) => {
      if (!prev) return prev;
      const newData = { ...prev, [key]: value };

      const field = REQUIRED_FIELDS.find((f) => f.key === key);
      if (field) {
        const err = field.validate(value);
        setErrors((prevErr) => {
          const next = { ...prevErr };
          if (err) next[key] = err;
          else delete next[key];
          return next;
        });
      }
      if (key === "start_date" || key === "end_date") {
        const crossErrs = validate(newData);
        setErrors((prevErr) => {
          const next = { ...prevErr };
          if (crossErrs.end_date) next.end_date = crossErrs.end_date;
          else delete next.end_date;
          return next;
        });
      }
      if (key === "max_seats" || key === "booked_seats") {
        const crossErrs = validate(newData);
        setErrors((prevErr) => {
          const next = { ...prevErr };
          if (crossErrs.booked_seats) next.booked_seats = crossErrs.booked_seats;
          else delete next.booked_seats;
          return next;
        });
      }

      return newData;
    });

    setTouched((t) => ({ ...t, [key]: true }));
  };

  const markTouched = (key: string) => {
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const onSubmit = async (e: React.FormEvent, forceSave = false) => {
    e.preventDefault();
    if (!edit) return;

    const allTouched: Record<string, boolean> = {};
    REQUIRED_FIELDS.forEach((f) => (allTouched[f.key] = true));
    setTouched(allTouched);

    const validationErrors = validate(edit);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
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

      // Rimuoviamo le proprietà relazionali aggregate/JOIN 
      // per non inviarle alla tabella "events" durante l'upsert
      const { event_places, tour_type, ...cleanEdit } = edit;

      const payload = {
        ...cleanEdit,
        id,
        start_date: cleanEdit.start_date || new Date().toISOString(),
        end_date: cleanEdit.end_date || null,
        sort_order: Number(cleanEdit.sort_order ?? 0),
        price_euro: cleanEdit.price_euro == null || cleanEdit.price_euro === "" ? null : Number(cleanEdit.price_euro),
      };

      // 1. Salva i dati dell'evento
      const { error } = await supabase.from("events").upsert(payload as any, { onConflict: "id" });
      if (error) throw error;

      // 2. Sincronizza i luoghi associati (tabella pivot)
      if (edit.id) {
        await supabase.from("event_places").delete().eq("event_id", id);
      }
      if (selPlaces.length > 0) {
        const { error: err2 } = await supabase.from("event_places").insert(
          selPlaces.map((pid) => ({ event_id: id, place_id: pid })) as any
        );
        if (err2) throw err2;
      }

      notify("success", "Evento salvato");
      setOpen(false);
      load();
    } catch (e: any) {
      notify("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r: Row) => {
    if (!confirm("Eliminare l'evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", r.id);
    if (error) notify("error", error.message);
    else { notify("success", "Evento eliminato"); load(); }
  };

  return (
    <PageHeader
      title="Eventi / Calendario Prossime Partenze"
      subtitle="Pianifica le visite guidate di gruppo con date, disponibilità e posti"
      icon={<CalendarDays className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come gestire il Calendario Eventi e Partenze"
        description="Gli Eventi permettono ai visitatori di scoprire le visite già programmate con date fisse e iscriversi o richiedere una data privata."
        badge="Guida Eventi"
        steps={[
          {
            title: "1. Data e Orario",
            description: "Imposta data e ora di inizio e fine dell'evento. Apparirà automaticamente ordinato cronologicamente nel sito.",
            badge: "Calendario",
          },
          {
            title: "2. Posti e Stato",
            description: "Imposta i posti totali e quelli già prenotati. Lo stato (Aperto, Ultimi posti, Esaurito) aggiorna i badge nel sito.",
            badge: "Disponibilità",
          },
          {
            title: "3. Luoghi & Tappe",
            description: "Collega i luoghi che compongono la tappa per mostrare ai visitatori l'itinerario esatto.",
            badge: "Tappe",
          },
        ]}
        tips={[
          "Quando rimangono meno di 3 posti, imposta lo stato su 'Ultimi posti' per incentivare le iscrizioni.",
          "I campi contrassegnati con * sono obbligatori per creare un evento.",
        ]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-[#7A6655]">{rows.length} eventi</p>
            {rows.filter((r) => !r.tour_type_id).length > 0 && (
              <button
                type="button"
                onClick={() => setFilterUnassigned(!filterUnassigned)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold transition-all border shadow-sm cursor-pointer",
                  filterUnassigned
                    ? "bg-[#B22A2A] text-white border-[#B22A2A]"
                    : "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300"
                )}
                title="Filtra per mostrare solo gli eventi senza categoria"
              >
                <AlertTriangle className={cn("w-3.5 h-3.5", filterUnassigned ? "text-white" : "text-amber-700")} />
                <span>{rows.filter((r) => !r.tour_type_id).length} da correggere (senza categoria)</span>
                {filterUnassigned && <span className="ml-1 text-[10px] underline">(mostra tutti)</span>}
              </button>
            )}
          </div>
          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C] shrink-0">
            <Plus className="w-4 h-4" /> Nuovo evento
          </button>
        </div>
        {loading ? null : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessun evento</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F9F4EC] text-[#5C4C38] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Evento</th>
                  <th className="px-5 py-3 text-left font-semibold">Data</th>
                  <th className="px-5 py-3 text-left font-semibold">Categoria</th>
                  <th className="px-5 py-3 text-left font-semibold">Posti</th>
                  <th className="px-5 py-3 text-left font-semibold">Stato</th>
                  <th className="px-5 py-3 text-right font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8D6]">
                {(filterUnassigned ? rows.filter((r) => !r.tour_type_id) : rows).map((r) => {
                  const st = STATUSES.find(s => s.v === r.status) || STATUSES[3];
                  const hasNoCategory = !r.tour_type_id;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "hover:bg-[#F9F4EC]/60 transition-colors",
                        hasNoCategory && "bg-amber-50/50"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#1E160A]">{r.title_it}</p>
                          {hasNoCategory && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-wider"
                              title="Questo evento non ha alcuna categoria tour assegnata"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" /> Da correggere
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7A6655] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 inline" />
                          {r.event_places?.map((x: any) => x.place?.name_it).filter(Boolean).join(", ") || r.subtitle_it || "Luogo da definire"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[#5C4C38] text-xs whitespace-nowrap">
                        {formatDate(r.start_date)}
                        {r.end_date && <span className="text-[#92816A]"> → {formatDate(r.end_date)}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {r.tour_type ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm text-white"
                            style={{ backgroundColor: r.tour_type.color }}>
                            {r.tour_type.name_it}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            Da associare
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#92816A]" />
                          <span className="text-xs font-mono font-semibold text-[#3D2E1A]">
                            {r.booked_seats || 0}/{r.max_seats || "∞"}
                          </span>
                          {r.max_seats && (r.booked_seats / r.max_seats) > 0.7 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C1C1C]">quasi pieno</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm", st.c)}>{st.l}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38] flex items-center justify-center"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(r)} className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
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

      <EventModal
        open={open}
        onClose={() => setOpen(false)}
        edit={edit}
        tt={tt}
        places={places}
        selPlaces={selPlaces}
        setSelPlaces={setSelPlaces}
        errors={errors}
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