"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import TranslateButton from "@/components/admin/TranslateButton";
import {
  Tags, Plus, Edit2, Trash2, Loader2,
  AlertCircle, CheckCircle2, Info, ChevronDown, ChevronRight, X, Languages,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDbError } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";
import { translateLongText } from "@/lib/translateClient";

type Row = any;

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
  id: null, slug: "", name_it: "", name_en: "",
  description_it: "", description_en: "",
  color: "#B22A2A", icon: null, sort_order: 0,
  is_active: true, is_custom_tour: false, is_exclusive: false,
};

const COLORS = ["#B22A2A", "#4A6535", "#3D6E90", "#9C1C1C", "#244D68", "#8A7B5A"];

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
];

const RECOMMENDED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "description_it", label: "Descrizione IT" },
  { key: "color", label: "Colore badge" },
];

// Componente sezione collassabile
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

// ✅ Modale custom con Portal e scroll reset
function TourTypeModal({
  open, onClose, edit, errors, touched, showWarnings, saving, onSubmit,
  updateField, markTouched, setShowWarnings, getMissingRecommended, errorBannerRef,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Riferimenti all'ultimo valore IT tradotto/visto (per evitare loop e tradurre appena l'utente modifica IT)
  const lastSeenNameIt = useRef("");
  const lastSeenDescIt = useRef("");

  // Stati dei badge di caricamento traduzione
  const [translatingName, setTranslatingName] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingDesc, setTranslatingDesc] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (open) {
      lastSeenNameIt.current = edit?.name_it || "";
      lastSeenDescIt.current = edit?.description_it || "";
    }
  }, [open, edit?.id]);

  // 1. AUTO-TRANSLATE: NOME (IT -> EN)
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

  // 2. AUTO-TRANSLATE: DESCRIZIONE (IT -> EN)
  useEffect(() => {
    const valIT = edit?.description_it;
    if (!open || !valIT || valIT.trim().length < 6 || valIT === lastSeenDescIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingDesc("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenDescIt.current = valIT;
        updateField("description_en", translated);
        setTranslatingDesc("success");
        setTimeout(() => setTranslatingDesc("idle"), 2000);
      } catch {
        setTranslatingDesc("error");
        setTimeout(() => setTranslatingDesc("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [edit?.description_it, open]);

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E160A]/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={modalRef} className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">{edit.id ? "Modifica categoria" : "Nuova categoria"}</h2>
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
                  <button type="button" onClick={() => onSubmit({ preventDefault: () => {} } as any, true)} className="px-3 py-1.5 text-xs font-medium bg-[#4A6535] text-white rounded-sm hover:bg-[#3A5228]">
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
            <Field label="Slug (URL)">
              <input className={inputClass("slug")} value={edit.slug || ""} onChange={(e) => updateField("slug", e.target.value)} placeholder="generato automaticamente se vuoto" />
            </Field>
            <Grid2>
              <Field label={<>Descrizione IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <textarea rows={3} className={cn(inputClass("description_it"), "resize-y")} value={edit.description_it || ""} onChange={(e) => updateField("description_it", e.target.value)} />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Descrizione EN</span>
                    <div className="flex items-center gap-1.5">
                      <AutoTranslateBadge state={translatingDesc} />
                      <TranslateButton
                        sourceText={edit.description_it || ""}
                        onTranslated={(t) => {
                          lastSeenDescIt.current = edit.description_it || "";
                          updateField("description_en", t);
                        }}
                      />
                    </div>
                  </div>
                }
              >
                <textarea
                  rows={3}
                  className={cn(inputClass("description_en"), "resize-y")}
                  value={edit.description_en || ""}
                  onChange={(e) => {
                    updateField("description_en", e.target.value);
                  }}
                />
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Aspetto e Visibilità */}
          <CollapsibleSection title="Aspetto e Visibilità" color="bg-[#4A6535]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Colore badge <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>} hint="Usato per card e tag del sito pubblico">
                <div className="flex flex-wrap gap-2 items-center">
                  {COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => updateField("color", c)}
                      className={cn("w-9 h-9 rounded-sm shadow-sm transition-transform",
                        edit.color === c ? "ring-2 ring-[#1E160A] scale-110" : "hover:scale-105")}
                      style={{ backgroundColor: c }} aria-label={c} />
                  ))}
                  <input type="color" value={edit.color || "#B22A2A"}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="w-9 h-9 rounded-sm border border-[#E9DCC4] bg-white cursor-pointer" />
                </div>
              </Field>
              <Field label="Ordine di visualizzazione">
                <input type="number" className={inputClass("sort_order")} value={edit.sort_order ?? 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Pubblica nel sito">
                <select className={inputClass("is_active")} value={edit.is_active ? "1" : "0"} onChange={(e) => updateField("is_active", e.target.value === "1")}>
                  <option value="1">Sì, visibile</option>
                  <option value="0">No, nascosta</option>
                </select>
              </Field>
              <Field label="Categoria 'Esperienza esclusiva'">
                <select className={inputClass("is_exclusive")} value={edit.is_exclusive ? "1" : "0"} onChange={(e) => updateField("is_exclusive", e.target.value === "1")}>
                  <option value="0">No</option>
                  <option value="1">Sì — sezione 'Esperienze Esclusive'</option>
                </select>
              </Field>
            </Grid2>
            <Field label="Categoria 'Tour su misura'">
              <select className={inputClass("is_custom_tour")} value={edit.is_custom_tour ? "1" : "0"} onChange={(e) => updateField("is_custom_tour", e.target.value === "1")}>
                <option value="0">No</option>
                <option value="1">Sì — opzione nel form prenotazioni</option>
              </select>
            </Field>
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
              {edit.id ? "Aggiorna categoria" : "Crea categoria"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body // ✅ Fix del blur tagliato
  );
}

export default function TourTypesPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Nuovi stati per validazione
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showWarnings, setShowWarnings] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tour_types").select("*").order("sort_order");
    if (error) notify("error", formatDbError(error.message));
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF, sort_order: rows.length });
    setErrors({}); setTouched({}); setShowWarnings(false);
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    setEdit({ ...r });
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
      if (f.key === "description_it") return !v || String(v).trim().length < 10;
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
      const payload = {
        ...edit,
        id: edit.id ?? crypto.randomUUID(),
        slug: edit.slug || String(edit.name_it).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        sort_order: Number(edit.sort_order ?? 0),
      };
      const { error } = await supabase.from("tour_types").upsert(payload as any, { onConflict: "id" });
      if (error) throw error;
      notify("success", "Categoria salvata");
      setOpen(false); load();
    } catch (e: any) { notify("error", formatDbError(e.message)); }
    finally { setSaving(false); }
  };

  const countLinked = async (tourTypeId: string) => {
    const [events, places] = await Promise.all([
      supabase.from("events").select("id", { count: "exact", head: true }).eq("tour_type_id", tourTypeId),
      supabase.from("place_tour_types").select("place_id", { count: "exact", head: true }).eq("tour_type_id", tourTypeId),
    ]);
    return {
      events: events.count ?? 0,
      places: places.count ?? 0,
    };
  };

  const onDeactivate = async (r: Row) => {
    const { error } = await (supabase.from("tour_types") as any)
      .update({ is_active: false })
      .eq("id", r.id);
    if (error) notify("error", formatDbError(error.message));
    else { notify("success", "Categoria disattivata (nascosta dal sito)"); load(); }
  };

  const onDelete = async (r: Row) => {
    const linked = await countLinked(r.id);
    if (linked.events > 0) {
      notify(
        "error",
        `Impossibile eliminare "${r.name_it}": collegata a ${linked.events} evento/i. Vai in Eventi e riassegna o elimina gli eventi, oppure disattiva la categoria.`
      );
      return;
    }

    const extra =
      linked.places > 0
        ? ` Verranno scollegati ${linked.places} luogo/i (i luoghi restano nel sito).`
        : "";
    if (!confirm(`Eliminare la categoria "${r.name_it}"?${extra}`)) return;

    const { error } = await supabase.from("tour_types").delete().eq("id", r.id);
    if (error) notify("error", formatDbError(error.message));
    else { notify("success", "Categoria eliminata"); load(); }
  };

  return (
    <PageHeader
      title="Categorie Tour"
      subtitle="Organizza i tour tematici (Città d'Arte, Ville Venete, Grande Guerra, Esperienze Esclusive)"
      icon={<Tags className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come funzionano le Categorie Tour"
        description="Le categorie tour raggruppano i luoghi e gli eventi in percorsi tematici riconoscibili sul sito pubblico attraverso colori e badge dedicati."
        badge="Guida Categorie"
        steps={[
          {
            title: "1. Categorie Standard",
            description: "Città d'Arte, Ville Venete, Grande Guerra: mostrano i rispettivi luoghi nella sezione 'Tour' del sito.",
            badge: "Standard",
          },
          {
            title: "2. Esperienze Esclusive",
            description: "Attiva l'opzione 'Esperienza esclusiva' per far apparire i luoghi nella sezione scura serale del sito.",
            badge: "Esclusiva",
          },
          {
            title: "3. Tour su Misura",
            description: "Attiva 'Tour su misura' per aggiungere l'opzione nel selettore del modulo di prenotazione del cliente.",
            badge: "Su Misura",
          },
        ]}
        tips={[
          "Assegna colori armoniosi (es. Terracotta, Oliva, Blu Adria) per distinguere a colpo d'occhio le categorie.",
          "I testi introduttivi della sezione Tour si modificano nell'Editor Live.",
        ]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex items-center justify-between">
          <p className="text-sm text-[#7A6655]">{rows.length} categorie</p>
          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C]">
            <Plus className="w-4 h-4" /> Nuova categoria
          </button>
        </div>
        {loading ? null : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessuna categoria</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {rows.map((r) => (
              <div key={r.id} className="border border-[#E9DCC4] rounded-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-sm shrink-0 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: r.color }}>
                    {(r.name_it || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E160A] truncate">{r.name_it}</p>
                    <p className="text-xs text-[#7A6655] mt-0.5 truncate">{r.name_en}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.is_exclusive && <Tag color="adria">Esclusiva</Tag>}
                  {r.is_custom_tour && <Tag color="olive">Su misura</Tag>}
                  {!r.is_exclusive && !r.is_custom_tour && <Tag color="terracotta">Standard</Tag>}
                  {!r.is_active && <Tag color="stone">Disattiva</Tag>}
                </div>
                {r.description_it && <p className="text-xs text-[#5C4C38] line-clamp-3">{r.description_it}</p>}
                <div className="flex justify-end gap-1 pt-2 border-t border-[#F0E8D6] mt-auto">
                  {!r.is_active ? null : (
                    <button onClick={() => onDeactivate(r)}
                      className="px-2 h-8 rounded-sm hover:bg-[#F0E8D6] text-[#7A6655] text-[10px] font-bold uppercase tracking-wider"
                      title="Nascondi dal sito senza eliminare">
                      Off
                    </button>
                  )}
                  <button onClick={() => openEdit(r)}
                    className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38] flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(r)}
                    className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Nuovo modale custom con Portal */}
      <TourTypeModal
        open={open}
        onClose={() => setOpen(false)}
        edit={edit}
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

function Tag({ color, children }: { color: "terracotta" | "olive" | "adria" | "stone"; children: React.ReactNode }) {
  const cls = {
    terracotta: "bg-[#B22A2A]/10 text-[#9C1C1C] border-[#B22A2A]/20",
    olive: "bg-[#4A6535]/15 text-[#3A5228] border-[#4A6535]/30",
    adria: "bg-[#3D6E90]/10 text-[#244D68] border-[#3D6E90]/20",
    stone: "bg-[#F0E8D6] text-[#5C4C38] border-[#E9DCC4]",
  } as const;
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm", cls[color])}>
      {children}
    </span>
  );
}