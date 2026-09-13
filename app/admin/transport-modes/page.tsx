"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import TranslateButton from "@/components/admin/TranslateButton";
import {
  Bus, Plus, Edit2, Trash2, Loader2,
  AlertCircle, CheckCircle2, Info, ChevronDown, ChevronRight, X,
  Footprints, Bike, Car, CarFront, Train, Ship, Plane, CarTaxiFront, Truck, PersonStanding,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDbError } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";
import { translateLongText } from "@/lib/translateClient";

type Row = any;

const ICON_OPTIONS: Array<{ name: string; Icon: any }> = [
  { name: "Footprints", Icon: Footprints },
  { name: "Bike", Icon: Bike },
  { name: "Car", Icon: Car },
  { name: "CarFront", Icon: CarFront },
  { name: "Bus", Icon: Bus },
  { name: "CarTaxiFront", Icon: CarTaxiFront },
  { name: "Train", Icon: Train },
  { name: "Ship", Icon: Ship },
  { name: "Plane", Icon: Plane },
  { name: "Truck", Icon: Truck },
  { name: "PersonStanding", Icon: PersonStanding },
];

function renderIcon(iconName: string | null | undefined, className = "w-5 h-5") {
  const found = ICON_OPTIONS.find((o) => o.name === iconName);
  if (!found) return null;
  const Ico = found.Icon;
  return <Ico className={className} />;
}

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
  icon_name: "Footprints", color: "#4A6535", sort_order: 0,
  is_active: true, is_available_for_booking: true, is_available_for_places: true,
};

const COLORS = ["#B22A2A", "#4A6535", "#3D6E90", "#9C1C1C", "#244D68", "#8A7B5A", "#C4923A", "#7A6655"];

const REQUIRED_FIELDS: Array<{ key: string; label: string; validate: (v: any) => string | null }> = [
  { key: "name_it", label: "Nome in italiano", validate: (v) => (!v || String(v).trim().length < 2 ? "Inserisci un nome in italiano" : null) },
  { key: "name_en", label: "Nome in inglese", validate: (v) => (!v || String(v).trim().length < 2 ? "Inserisci un nome in inglese" : null) },
  { key: "slug", label: "Slug (chiave univoca)", validate: (v) => (!v || !/^[a-z0-9_-]+$/.test(String(v).trim()) ? "Slug obbligatorio: solo lettere minuscole, numeri, trattini" : null) },
];

const RECOMMENDED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "description_it", label: "Descrizione IT" },
  { key: "color", label: "Colore badge" },
  { key: "icon_name", label: "Icona" },
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

function TransportModeModal({
  open, onClose, edit, errors, touched, showWarnings, saving, onSubmit,
  updateField, markTouched, setShowWarnings, getMissingRecommended, errorBannerRef,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSeenNameIt = useRef("");
  const lastSeenDescIt = useRef("");
  const [translatingName, setTranslatingName] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingDesc, setTranslatingDesc] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (open) {
      lastSeenNameIt.current = edit?.name_it || "";
      lastSeenDescIt.current = edit?.description_it || "";
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

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">{edit.id ? "Modifica mezzo di trasporto" : "Nuovo mezzo di trasporto"}</h2>
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
                  <button type="button" onClick={() => onSubmit({ preventDefault: () => {} } as any, true)} className="px-3 py-1.5 text-xs font-medium bg-[#4A6535] text-white rounded-sm hover:bg-[#3A5228]">
                    Salva comunque
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  onChange={(e) => updateField("name_en", e.target.value)}
                  onBlur={() => markTouched("name_en")}
                />
              </Field>
            </Grid2>
            <Field label={<>Slug (chiave univoca) <span className="text-[#B22A2A]">*</span></>} hint="Es. walk, bike, moto, car, bus" error={errors.slug && touched.slug ? errors.slug : undefined}>
              <input required className={inputClass("slug")} value={edit.slug || ""} onChange={(e) => updateField("slug", String(e.target.value).toLowerCase().trim())} placeholder="es. a-piedi, treno, nave..." />
            </Field>
            <Grid2>
              <Field label={<>Descrizione IT <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>} hint="Descrizione breve per admin o tooltip">
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
                  onChange={(e) => updateField("description_en", e.target.value)}
                />
              </Field>
            </Grid2>
          </CollapsibleSection>

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
                  <input type="color" value={edit.color || "#4A6535"}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="w-9 h-9 rounded-sm border border-[#E9DCC4] bg-white cursor-pointer" />
                </div>
              </Field>
              <Field label={<>Icona <span className="text-[#C4923A] text-[10px] font-normal normal-case">(consigliato)</span></>} hint="Icona lucide-react associata al mezzo">
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(({ name, Icon }) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => updateField("icon_name", name)}
                      title={name}
                      className={cn(
                        "w-10 h-10 rounded-sm border flex items-center justify-center transition-all",
                        edit.icon_name === name
                          ? "bg-[#4A6535]/10 border-[#4A6535] text-[#3A5228] ring-2 ring-[#4A6535]/30"
                          : "border-[#E9DCC4] text-[#5C4C38] hover:bg-[#F9F4EC]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </Field>
            </Grid2>
            <Field label="Ordine di visualizzazione">
              <input type="number" className={inputClass("sort_order")} value={edit.sort_order ?? 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} />
            </Field>
            <Grid2>
              <Field label="Pubblica nel sito">
                <select className={inputClass("is_active")} value={edit.is_active ? "1" : "0"} onChange={(e) => updateField("is_active", e.target.value === "1")}>
                  <option value="1">Sì, visibile</option>
                  <option value="0">No, nascosto</option>
                </select>
              </Field>
              <Field label="Disponibile per prenotazioni">
                <select className={inputClass("is_available_for_booking")} value={edit.is_available_for_booking ? "1" : "0"} onChange={(e) => updateField("is_available_for_booking", e.target.value === "1")}>
                  <option value="1">Sì — nel form pubblico</option>
                  <option value="0">No</option>
                </select>
              </Field>
            </Grid2>
            <Field label="Disponibile per luoghi (tag mezzi)">
              <select className={inputClass("is_available_for_places")} value={edit.is_available_for_places ? "1" : "0"} onChange={(e) => updateField("is_available_for_places", e.target.value === "1")}>
                <option value="1">Sì — sezione Luoghi admin</option>
                <option value="0">No</option>
              </select>
            </Field>
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
            <button type="button" onClick={(e) => onSubmit(e as any, false)} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-[#4A6535] text-white rounded-sm text-sm font-medium hover:bg-[#3A5228] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {edit.id ? "Aggiorna mezzo" : "Crea mezzo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Tag({ color, children }: { color: "terracotta" | "olive" | "adria" | "stone" | "gold"; children: React.ReactNode }) {
  const cls = {
    terracotta: "bg-[#B22A2A]/10 text-[#9C1C1C] border-[#B22A2A]/20",
    olive: "bg-[#4A6535]/15 text-[#3A5228] border-[#4A6535]/30",
    adria: "bg-[#3D6E90]/10 text-[#244D68] border-[#3D6E90]/20",
    stone: "bg-[#F0E8D6] text-[#5C4C38] border-[#E9DCC4]",
    gold: "bg-[#C4923A]/10 text-[#8B6F00] border-[#C4923A]/25",
  } as const;
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm", cls[color])}>
      {children}
    </span>
  );
}

export default function TransportModesPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showWarnings, setShowWarnings] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("transport_modes") as any).select("*").order("sort_order");
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
        sort_order: Number(edit.sort_order ?? 0),
      };
      const { error } = await (supabase.from("transport_modes") as any).upsert(payload, { onConflict: "id" });
      if (error) throw error;
      notify("success", "Mezzo di trasporto salvato");
      setOpen(false); load();
    } catch (e: any) { notify("error", formatDbError(e.message)); }
    finally { setSaving(false); }
  };

  const countLinked = async (slug: string) => {
    const [bookings, places] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("transport", slug),
      supabase.from("places").select("id", { count: "exact", head: true }).contains("transport_options", [slug]),
    ]);
    return {
      bookings: bookings.count ?? 0,
      places: places.count ?? 0,
    };
  };

  const onDeactivate = async (r: Row) => {
    const { error } = await (supabase.from("transport_modes") as any)
      .update({ is_active: false })
      .eq("id", r.id);
    if (error) notify("error", formatDbError(error.message));
    else { notify("success", "Mezzo disattivato (nascosto dal sito)"); load(); }
  };

  const onActivate = async (r: Row) => {
    const { error } = await (supabase.from("transport_modes") as any)
      .update({ is_active: true })
      .eq("id", r.id);
    if (error) notify("error", formatDbError(error.message));
    else { notify("success", "Mezzo riattivato (visibile nel sito)"); load(); }
  };

  const onToggleActive = (r: Row) => r.is_active ? onDeactivate(r) : onActivate(r);

  const onDelete = async (r: Row) => {
    const linked = await countLinked(r.slug);
    if (linked.bookings > 0 || linked.places > 0) {
      notify(
        "error",
        `Impossibile eliminare "${r.name_it}": collegato a ${linked.bookings} prenotazione/i e ${linked.places} luogo/i. Disattivalo invece di eliminarlo.`
      );
      return;
    }
    if (!confirm(`Eliminare il mezzo di trasporto "${r.name_it}"?`)) return;
    const { error } = await supabase.from("transport_modes").delete().eq("id", r.id);
    if (error) notify("error", formatDbError(error.message));
    else { notify("success", "Mezzo eliminato"); load(); }
  };

  return (
    <PageHeader
      title="Mezzi di Trasporto"
      subtitle="Gestisci le opzioni del form prenotazioni e i tag mezzi disponibili per i luoghi (A piedi, Bici, Moto, Auto, Pullman, ecc.)"
      icon={<Bus className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come funzionano i Mezzi di Trasporto"
        description="Ogni mezzo corrisponde a un'opzione del form di prenotazione pubblica e a un tag associabile ai luoghi. Puoi aggiungere nuovi mezzi (es. Treno, Nave, Taxi), disattivarli temporaneamente o modificare colori e icone."
        badge="Guida Trasporti"
        steps={[
          {
            title: "1. Visibilità pubblica",
            description: "Solo i mezzi con 'Pubblica nel sito = Sì' e 'Disponibile per prenotazioni = Sì' appaiono nel modulo clienti.",
            badge: "Booking",
          },
          {
            title: "2. Tag per i luoghi",
            description: "I mezzi con 'Disponibile per luoghi = Sì' possono essere selezionati come tag nella scheda di ogni luogo.",
            badge: "Luoghi",
          },
          {
            title: "3. Colori e icone",
            description: "Personalizza badge e icone per differenziare velocemente i mezzi nelle liste admin e nel sito.",
            badge: "UI",
          },
        ]}
        tips={[
          "Lo slug (es. walk, bike, car) è la chiave tecnica: usalo breve e minuscolo con trattini.",
          "Non eliminare mezzi che hanno prenotazioni o luoghi collegati: disattivali per nasconderli senza perdere dati storici.",
          "L'auto (car) è abilitata di default e viene ora salvata correttamente nel DB.",
        ]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex items-center justify-between">
          <p className="text-sm text-[#7A6655]">{rows.length} mezzi di trasporto</p>
          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C]">
            <Plus className="w-4 h-4" /> Nuovo mezzo
          </button>
        </div>
        {loading ? null : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessun mezzo di trasporto</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {rows.map((r) => (
              <div key={r.id} className="border border-[#E9DCC4] rounded-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span
                    className="w-10 h-10 rounded-sm shrink-0 flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: r.color }}
                  >
                    {renderIcon(r.icon_name, "w-5 h-5") ?? <span className="font-bold text-sm">{(r.name_it || "?").charAt(0).toUpperCase()}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E160A] truncate">{r.name_it}</p>
                    <p className="text-xs text-[#7A6655] mt-0.5 truncate">{r.name_en}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#92816A] mt-1 font-mono">slug: {r.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.is_available_for_booking && <Tag color="terracotta">Booking</Tag>}
                  {r.is_available_for_places && <Tag color="olive">Luoghi</Tag>}
                  {!r.is_available_for_booking && !r.is_available_for_places && <Tag color="stone">Nascosto</Tag>}
                  {!r.is_active && <Tag color="gold">Disattivato</Tag>}
                </div>
                {r.description_it && <p className="text-xs text-[#5C4C38] line-clamp-3">{r.description_it}</p>}
                <div className="flex justify-end gap-1 pt-2 border-t border-[#F0E8D6] mt-auto">
                  <button onClick={() => onToggleActive(r)}
                    className={cn(
                      "px-2.5 h-8 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors",
                      r.is_active
                        ? "text-[#7A6655] hover:bg-[#F0E8D6]"
                        : "bg-[#4A6535]/15 text-[#3A5228] hover:bg-[#4A6535]/25 border border-[#4A6535]/30"
                    )}
                    title={r.is_active ? "Nascondi dal sito senza eliminare" : "Rendi visibile nel sito"}>
                    {r.is_active ? "On" : "Off"}
                  </button>
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

      <TransportModeModal
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
