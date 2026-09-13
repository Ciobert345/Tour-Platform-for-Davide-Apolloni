"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import {
  MessageSquare, Plus, Edit2, Trash2, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle, Star,
  Filter, MapPin, AlertCircle, Info, ChevronDown, ChevronRight, X,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDate, renderStars } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";

type Row = any;
type TT = any;

const DEF: Row = {
  id: null,
  author_name: "",
  author_location_it: "",
  author_location_en: "",
  review_text: "",
  rating: 5,
  status: "pending",
  tour_type_id: null,
};

const STATUSES = [
  { v: "pending", l: "In attesa", c: "bg-[#C4923A]/15 text-[#B89200] border-[#C4923A]/30", icon: Clock },
  { v: "approved", l: "Approvata", c: "bg-[#4A6535]/15 text-[#3A5228] border-[#4A6535]/30", icon: CheckCircle2 },
  { v: "rejected", l: "Respinta", c: "bg-[#9C1C1C]/10 text-[#9C1C1C] border-[#B22A2A]/30", icon: XCircle },
];

const FILTERS = [
  { v: "all", l: "Tutte" },
  { v: "pending", l: "In attesa" },
  { v: "approved", l: "Approvate" },
  { v: "rejected", l: "Respinte" },
];

const REQUIRED_FIELDS: Array<{ key: string; label: string; validate: (v: any) => string | null }> = [
  {
    key: "author_name",
    label: "Nome autore",
    validate: (v) => (!v || String(v).trim().length < 2 ? "Inserisci il nome dell'autore" : null),
  },
  {
    key: "review_text",
    label: "Testo recensione",
    validate: (v) => (!v || String(v).trim().length < 10 ? "Inserisci un testo di almeno 10 caratteri" : null),
  },
  {
    key: "rating",
    label: "Valutazione",
    validate: (v) => {
      const n = Number(v);
      return Number.isNaN(n) || n < 1 || n > 5 ? "Seleziona una valutazione da 1 a 5" : null;
    },
  },
];

const RECOMMENDED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "author_location_it", label: "Luogo autore (IT)" },
  { key: "tour_type_id", label: "Tipologia tour collegata" },
];

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

function ReviewModal({
  open, onClose, edit, tt, errors, touched, showWarnings, saving, onSubmit,
  updateField, markTouched, setShowWarnings, getMissingRecommended, errorBannerRef,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">{edit.id ? "Modifica recensione" : "Nuova recensione"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center text-[#7A6655]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
                  <button type="button" onClick={() => onSubmit({ preventDefault: () => { } } as any, true)} className="px-3 py-1.5 text-xs font-medium bg-[#9C1C1C] text-white rounded-sm hover:bg-[#7A1616]">
                    Salva comunque
                  </button>
                </div>
              </div>
            </div>
          )}

          <CollapsibleSection title="Informazioni autore" color="bg-[#B22A2A]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Nome autore <span className="text-[#B22A2A]">*</span></>} error={errors.author_name && touched.author_name ? errors.author_name : undefined}>
                <input required className={inputClass("author_name")} value={edit.author_name || ""} onChange={(e) => updateField("author_name", e.target.value)} onBlur={() => markTouched("author_name")} placeholder="Es. Mario Rossi" />
              </Field>
              <Field label={<>Valutazione <span className="text-[#B22A2A]">*</span></>} error={errors.rating && touched.rating ? errors.rating : undefined}>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => updateField("rating", n)} className="transition-transform hover:scale-110">
                      <Star className={cn("w-8 h-8", n <= edit.rating ? "text-[#C4923A] fill-[#C4923A]" : "text-[#C4B49A]")} />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-sm text-[#7A6655]">{edit.rating}/5</span>
                </div>
              </Field>
            </Grid2>
            <Grid2>
              <Field label={<>Luogo autore IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <input className={inputClass("author_location_it")} value={edit.author_location_it || ""} onChange={(e) => updateField("author_location_it", e.target.value)} placeholder="Es. Verona, Italia" />
              </Field>
              <Field label="Luogo autore EN">
                <input className={inputClass("author_location_en")} value={edit.author_location_en || ""} onChange={(e) => updateField("author_location_en", e.target.value)} placeholder="e.g. Verona, Italy" />
              </Field>
            </Grid2>
          </CollapsibleSection>

          <CollapsibleSection title="Contenuto recensione" color="bg-[#4A6535]" defaultOpen={true}>
            <Field label={<>Testo recensione <span className="text-[#B22A2A]">*</span></>} hint={`${(edit.review_text || "").length} caratteri`} error={errors.review_text && touched.review_text ? errors.review_text : undefined}>
              <textarea required rows={6} className={cn(inputClass("review_text"), "resize-y")} value={edit.review_text || ""} onChange={(e) => updateField("review_text", e.target.value)} onBlur={() => markTouched("review_text")} placeholder="Scrivi qui il testo della recensione..." />
            </Field>
          </CollapsibleSection>

          <CollapsibleSection title="Collegamenti e Stato" color="bg-[#3D6E90]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Tipologia tour collegata <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>}>
                <select className={inputClass("tour_type_id")} value={edit.tour_type_id || ""} onChange={(e) => updateField("tour_type_id", e.target.value || null)}>
                  <option value="">— Nessuna —</option>
                  {tt.map((t: any) => <option key={t.id} value={t.id}>{t.name_it}</option>)}
                </select>
              </Field>
              <Field label="Stato moderazione">
                <select className={inputClass("status")} value={edit.status || "pending"} onChange={(e) => updateField("status", e.target.value)}>
                  {STATUSES.map((s: any) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </Field>
            </Grid2>
          </CollapsibleSection>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9DCC4] bg-[#F9F4EC]">
          <div className="flex items-center gap-1.5 text-xs text-[#7A6655]">
            <span className="text-[#B22A2A] font-bold">*</span> <span>obbligatori</span>
            <span className="mx-2 text-[#C4B49A]">|</span>
            <span className="text-[#C4923A] font-bold">consigliati</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-sm text-sm font-medium text-[#5C4C38] hover:bg-[#E9DCC4]">Annulla</button>
            <button type="button" onClick={(e) => onSubmit(e as any, false)} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-[#9C1C1C] text-white rounded-sm text-sm font-medium hover:bg-[#7A1616] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {edit.id ? "Aggiorna recensione" : "Crea recensione"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ReviewsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tt, setTt] = useState<TT[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showWarnings, setShowWarnings] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews_with_tour")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      const normalizedRows = (data ?? []).map((row: any) => ({
        ...row,
        tour_type: row.tour_type_id ? {
          name_it: row.tour_type_name_it,
          name_en: row.tour_type_name_en,
          color: row.tour_type_color
        } : null
      }));

      setRows(normalizedRows);

      const { data: ttData } = await supabase
        .from("tour_types")
        .select("id, name_it, name_en")
        .eq("is_active", true);
      setTt(ttData ?? []);

    } catch (error: any) {
      console.error("Errore caricamento recensioni:", error);
      notify("error", "Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF });
    setErrors({}); setTouched({}); setShowWarnings(false);
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    setEdit({ ...r });
    setErrors({}); setTouched({}); setShowWarnings(false);
    setOpen(true);
  };

  const quickStatus = async (r: Row, status: "approved" | "rejected") => {
    try {
      const { error } = await (supabase.from("reviews") as any)
        .update({ status, moderated_at: new Date().toISOString(), moderated_by: null })
        .eq("id", r.id);
      if (error) throw error;
      notify("success", `Recensione ${status === "approved" ? "approvata" : "respinta"}`);
      load();
    } catch (e: any) { notify("error", e.message); }
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
    return RECOMMENDED_FIELDS.filter((f) => !data[f.key]).map((f) => f.label);
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
      const id = edit.id || crypto.randomUUID();
      
      // ✅ FIX DEFINITIVO: Estraiamo e scartiamo TUTTI i campi virtuali/derivati dalla vista
      const {
        tour_type,
        tour_type_name_it,
        tour_type_name_en,
        tour_type_color,
        ...restOfEdit // Qui rimangono SOLO le colonne reali della tabella 'reviews'
      } = edit;

      const payload = {
        ...restOfEdit, 
        id,
        rating: Math.max(1, Math.min(5, Number(edit.rating) || 5)),
        submitted_at: edit.submitted_at || new Date().toISOString(),
      };

      if (edit.id && edit.status !== "pending") {
        payload.moderated_at = new Date().toISOString();
      }

      const { error } = await supabase.from("reviews").upsert(payload as any, { onConflict: "id" });
      
      if (error) throw error;
      
      notify("success", "Recensione salvata");
      setOpen(false); 
      load();
    } catch (e: any) { 
      notify("error", e.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const onDelete = async (r: Row) => {
    if (!confirm("Eliminare la recensione?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) notify("error", error.message);
    else { notify("success", "Recensione eliminata"); load(); }
  };

  const filtered = filter === "all" ? rows : rows.filter((r: any) => r.status === filter);
  const pendingCount = rows.filter((r: any) => r.status === "pending").length;

  return (
    <PageHeader
      title="Recensioni &amp; Testimonianze"
      subtitle="Modera, approva o rifiuta le testimonianze ricevute dai tuoi visitatori"
      icon={<MessageSquare className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come funziona la Moderazione delle Recensioni"
        description="Le recensioni lasciate dai visitatori sul sito arrivano in stato 'In attesa' e vengono mostrate pubblicamente solo dopo la tua approvazione."
        badge="Guida Recensioni"
        steps={[
          { title: "1. Notifiche Recensioni", description: "Le nuove recensioni compaiono con stato giallo 'In attesa'. Clicca sul pulsante verde ✓ per approvarle al volo.", badge: "Moderazione" },
          { title: "2. Visualizzazione nel Sito", description: "Solo le recensioni 'Approvate' appaiono nella sezione 'Cosa dicono i visitatori' del sito.", badge: "Pubblicazione" },
          { title: "3. Inserimento Manuale", description: "Puoi anche inserire manualmente testimonianze ricevute via email, Google o TripAdvisor con 'Nuova recensione'.", badge: "Manuale" },
        ]}
        tips={["I testi introduttivi della sezione Recensioni (titolo, sottotitolo) si modificano dall'Editor Live."]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-[#7A6655]">
              {filtered.length} di {rows.length} recensioni
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-[#B89200] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pendingCount} in attesa
                </span>
              )}
            </p>
            <div className="flex items-center gap-1.5 border border-[#E9DCC4] rounded-sm p-0.5 bg-[#F9F4EC]">
              <Filter className="w-3.5 h-3.5 text-[#92816A] ml-2" />
              {FILTERS.map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilter(f.v)}
                  className={cn(
                    "px-3 py-1 rounded-sm text-xs font-semibold transition-colors",
                    filter === f.v ? "bg-white text-[#9C1C1C] shadow-sm border border-[#E9DCC4]" : "text-[#7A6655] hover:text-[#3D2E1A]"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#9C1C1C] text-white rounded-sm text-sm font-medium hover:bg-[#7A1616]">
            <Plus className="w-4 h-4" /> Nuova recensione
          </button>
        </div>

        {loading ? null : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">
            Nessuna recensione{filter !== "all" ? ` nel filtro "${FILTERS.find(f => f.v === filter)?.l}"` : ""}
          </div>
        ) : (
          <div className="divide-y divide-[#F0E8D6]">
            {filtered.map((r: any) => {
              const st = STATUSES.find(s => s.v === r.status) || STATUSES[0];
              const StIcon = st.icon;
              return (
                <div key={r.id} className="px-5 py-4 hover:bg-[#F9F4EC]/60 flex gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#C4923A]/20 to-[#B22A2A]/20 flex items-center justify-center text-[#5C4C38] font-serif font-bold text-lg">
                    {r.author_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-[#1E160A]">{r.author_name}</p>
                      <span className="text-[#C4923A] text-sm">{renderStars(r.rating)}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm inline-flex items-center gap-1", st.c)}>
                        <StIcon className="w-3 h-3" /> {st.l}
                      </span>
                      {r.tour_type && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm text-white"
                          style={{ backgroundColor: r.tour_type.color }}
                        >
                          {r.tour_type.name_it}
                        </span>
                      )}
                    </div>
                    {r.author_location_it && (
                      <p className="text-xs text-[#7A6655] mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.author_location_it}</p>
                    )}
                    <p className="text-sm text-[#3D2E1A] leading-relaxed whitespace-pre-wrap">{r.review_text}</p>
                    <p className="text-[11px] text-[#92816A] mt-2">
                      Inviata il {formatDate(r.submitted_at)}
                      {r.moderated_at && ` · Moderata il ${formatDate(r.moderated_at)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => quickStatus(r, "approved")} className="w-8 h-8 rounded-sm hover:bg-[#4A6535]/10 text-[#4A6535] flex items-center justify-center" title="Approva">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => quickStatus(r, "rejected")} className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center" title="Rifiuta">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38] flex items-center justify-center" title="Modifica">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(r)} className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center" title="Elimina">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReviewModal
        open={open}
        onClose={() => setOpen(false)}
        edit={edit}
        tt={tt}
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