"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import {
  CalendarCheck, Plus, Edit2, Trash2, Loader2,
  Mail, Phone, MapPin, Users, Languages,
  Clock, CheckCircle2, Archive, Filter, MoreVertical, X,
  ChevronDown, ChevronRight,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDate } from "@/lib/utils";
import AdminTutorial from "@/components/admin/AdminTutorial";

type Row = any;
type TT = any;

const DEF: Row = {
  id: null,
  full_name: "",
  email: "",
  phone: "",
  tour_type_id: null,
  preferred_destination: "",
  preferred_date: null,
  alternative_date: null,
  participants: 2,
  visit_language: "it",
  transport: null,
  notes: "",
  gdpr_consent: true,
  status: "new",
  admin_notes: "",
};

const STATUSES = [
  { v: "new", l: "Nuova", c: "bg-[#B22A2A]/10 text-[#9C1C1C] border-[#B22A2A]/20", dot: "bg-[#B22A2A]" },
  { v: "contacted", l: "Contattata", c: "bg-[#3D6E90]/10 text-[#244D68] border-[#3D6E90]/20", dot: "bg-[#3D6E90]" },
  { v: "confirmed", l: "Confermata", c: "bg-[#4A6535]/15 text-[#3A5228] border-[#4A6535]/30", dot: "bg-[#4A6535]" },
  { v: "archived", l: "Archiviata", c: "bg-[#F0E8D6] text-[#5C4C38] border-[#E9DCC4]", dot: "bg-[#92816A]" },
];

const FILTERS = [
  { v: "all", l: "Tutte" },
  { v: "new", l: "Nuove" },
  { v: "contacted", l: "Contattate" },
  { v: "confirmed", l: "Confermate" },
  { v: "archived", l: "Archiviate" },
];

const TRANSPORT_FALLBACK: Record<string, string> = {
  walk: "A piedi",
  bike: "In bici",
  moto: "In moto",
  car: "In automobile",
  bus: "In autobus",
};

// Componente Dropdown Menu
function ActionMenu({ booking, onStatusChange, onEdit, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calcola la posizione del menu quando si apre
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: Math.min(rect.right + window.scrollX - 256, window.innerWidth - 260),
      });
    }
  }, [isOpen]);

  // Gestisce il click fuori dal menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isClickInsideButton = buttonRef.current?.contains(e.target as Node);
      const isClickInsideMenu = menuRef.current?.contains(e.target as Node);
      
      // Chiudi solo se il click è avvenuto FUORI sia dal bottone che dal menu
      if (!isClickInsideButton && !isClickInsideMenu) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      // Ritardo di 0ms per evitare che il click che ha aperto il menu lo chiuda immediatamente
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    // Piccolo ritardo per dare tempo al menu di chiudersi prima di aprire il modale
    setTimeout(() => action(), 50);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38] flex items-center justify-center transition-colors"
        title="Azioni"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-64 bg-white rounded-sm shadow-lg border border-[#E9DCC4] overflow-hidden z-[150]"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
          >
            <div className="px-3 py-2 border-b border-[#F0E8D6]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#92816A] mb-2">Cambia Stato</p>
              {booking.status === "new" && (
                <button onClick={() => handleAction(() => onStatusChange(booking, "contacted"))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#244D68] hover:bg-[#3D6E90]/5 rounded-sm transition-colors text-left">
                  <Mail className="w-4 h-4 shrink-0" />
                  <div><p className="font-medium">Segna come Contattata</p><p className="text-[10px] text-[#7A6655]">Hai già risposto al cliente</p></div>
                </button>
              )}
              {(booking.status === "new" || booking.status === "contacted") && (
                <button onClick={() => handleAction(() => onStatusChange(booking, "confirmed"))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3A5228] hover:bg-[#4A6535]/5 rounded-sm transition-colors text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div><p className="font-medium">Conferma Prenotazione</p><p className="text-[10px] text-[#7A6655]">Richiesta accettata</p></div>
                </button>
              )}
              {booking.status !== "archived" && (
                <button onClick={() => handleAction(() => onStatusChange(booking, "archived"))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5C4C38] hover:bg-[#F9F4EC] rounded-sm transition-colors text-left">
                  <Archive className="w-4 h-4 shrink-0" />
                  <div><p className="font-medium">Archivia</p><p className="text-[10px] text-[#7A6655]">Sposta fuori dalla vista principale</p></div>
                </button>
              )}
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#92816A] mb-2">Gestione</p>
              <button onClick={() => handleAction(() => onEdit(booking))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D2E1A] hover:bg-[#F9F4EC] rounded-sm transition-colors text-left">
                <Edit2 className="w-4 h-4 shrink-0" /><span>Modifica prenotazione</span>
              </button>
              <button onClick={() => handleAction(() => onDelete(booking))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#9C1C1C] hover:bg-[#9C1C1C]/5 rounded-sm transition-colors text-left">
                <Trash2 className="w-4 h-4 shrink-0" /><span>Elimina prenotazione</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ✅ Componente sezione collassabile (da aggiungere prima di BookingModal)
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
        <span className={`w-1 h-5 rounded-full ${color}`} />
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-[#92816A]" /> : <ChevronRight className="w-4 h-4 text-[#92816A]" />}
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

// ✅ Modale con sezioni collassabili (stesso stile delle recensioni)
function BookingModal({ open, onClose, edit, tt, transportModes, saving, onSubmit, updateField }: any) {
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

  if (!open || !edit) {
    //console.log("❌ Modale non renderizzato - open:", open, "edit:", edit);
    return null;
  }
  //console.log("✅ Modale renderizzato correttamente");

  const inputClass = "w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B22A2A]/30 focus:border-[#B22A2A] transition-colors";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E160A]/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={modalRef} className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4] bg-white">
          <h2 className="text-xl font-semibold text-[#1E160A] font-serif">{edit.id ? "Modifica prenotazione" : "Nuova prenotazione"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center text-[#7A6655]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body con scroll e sezioni collassabili */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          
          {/* Sezione: Informazioni principali */}
          <CollapsibleSection title="Informazioni principali" color="bg-[#B22A2A]" defaultOpen={true}>
            <Grid2>
              <Field label={<>Nome completo <span className="text-[#B22A2A]">*</span></>}>
                <input required className={inputClass} value={edit.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} placeholder="Es. Mario Rossi" />
              </Field>
              <Field label={<>Email <span className="text-[#B22A2A]">*</span></>}>
                <input required type="email" className={inputClass} value={edit.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="email@esempio.it" />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Telefono">
                <input className={inputClass} value={edit.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+39 ..." />
              </Field>
              <Field label="Numero partecipanti">
                <input type="number" min={1} className={inputClass} value={edit.participants ?? ""} onChange={(e) => updateField("participants", Number(e.target.value) || null)} />
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Dettagli tour */}
          <CollapsibleSection title="Dettagli tour" color="bg-[#4A6535]" defaultOpen={true}>
            <Grid2>
              <Field label="Tipologia tour">
                <select className={inputClass} value={edit.tour_type_id || ""} onChange={(e) => updateField("tour_type_id", e.target.value || null)}>
                  <option value="">— Non specificato —</option>
                  {tt.map((t: any) => <option key={t.id} value={t.id}>{t.name_it}</option>)}
                </select>
              </Field>
              <Field label="Lingua visita">
                <select className={inputClass} value={edit.visit_language || ""} onChange={(e) => updateField("visit_language", e.target.value || null)}>
                  <option value="">— Non specificata —</option>
                  <option value="it">Italiano</option>
                  <option value="en">Inglese</option>
                </select>
              </Field>
            </Grid2>
            <Field label="Destinazione preferita / Richiesta specifica">
              <input className={inputClass} value={edit.preferred_destination || ""} onChange={(e) => updateField("preferred_destination", e.target.value)} placeholder="Es. Ville Venete, Trento, Percorso Grande Guerra..." />
            </Field>
            <Grid2>
              <Field label="Data preferita">
                <input type="date" className={inputClass} value={(edit.preferred_date || "").slice(0, 10)} onChange={(e) => updateField("preferred_date", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </Field>
              <Field label="Data alternativa">
                <input type="date" className={inputClass} value={(edit.alternative_date || "").slice(0, 10)} onChange={(e) => updateField("alternative_date", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Mezzo di trasporto">
                <select className={inputClass} value={edit.transport || ""} onChange={(e) => updateField("transport", e.target.value || null)}>
                  <option value="">— Non specificato —</option>
                  {(transportModes && transportModes.length > 0 ? transportModes : Object.entries(TRANSPORT_FALLBACK).map(([slug, name_it]) => ({ slug, name_it }))).map((tm: any) => (
                    <option key={tm.slug} value={tm.slug}>{tm.name_it}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stato prenotazione">
                <select className={inputClass} value={edit.status || "new"} onChange={(e) => updateField("status", e.target.value)}>
                  {STATUSES.map((s: any) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </Field>
            </Grid2>
          </CollapsibleSection>

          {/* Sezione: Note */}
          <CollapsibleSection title="Note" color="bg-[#3D6E90]" defaultOpen={false}>
            <Field label="Note cliente">
              <textarea rows={3} className={`${inputClass} resize-y`} value={edit.notes || ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Messaggio inviato dal cliente..." />
            </Field>
            <Field label="Note amministrative (non visibili al cliente)">
              <textarea rows={3} className={`${inputClass} resize-y font-mono text-xs bg-[#F9F4EC]`} value={edit.admin_notes || ""} onChange={(e) => updateField("admin_notes", e.target.value)} placeholder="Appunti interni: contratto inviato, acconto ricevuto, ecc." />
            </Field>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9DCC4] bg-[#F9F4EC]">
          <div className="flex items-center gap-1.5 text-xs text-[#7A6655]">
            <span className="text-[#B22A2A] font-bold">*</span> <span>campi obbligatori</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-sm text-sm font-medium text-[#5C4C38] hover:bg-[#E9DCC4]">Annulla</button>
            <button type="submit" form="booking-form" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {edit.id ? "Aggiorna prenotazione" : "Crea prenotazione"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BookingsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tt, setTt] = useState<TT[]>([]);
  const [transportModes, setTransportModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [b, t, tm] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("tour_types").select("id,name_it,name_en,color").eq("is_active", true),
      (supabase.from("transport_modes") as any).select("slug,name_it,name_en,color,is_active").order("sort_order"),
    ]);

    const tourTypes = t.data ?? [];
    const bookingsWithTour = (b.data ?? []).map((booking: any) => ({
      ...booking,
      tour_type: booking.tour_type_id ? tourTypes.find((tt: any) => tt.id === booking.tour_type_id) || null : null,
    }));

    setRows(bookingsWithTour);
    setTt(tourTypes);
    setTransportModes(tm.data ?? []);
    setLoading(false);
  };

  const TRANSPORT_MAP: Record<string, string> = transportModes.reduce(
    (acc: Record<string, string>, r: any) => {
      acc[r.slug] = r.name_it;
      return acc;
    },
    { ...TRANSPORT_FALLBACK }
  );

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF });
    setOpen(true);
  };

  const openEdit = (r: Row) => {
    console.log("openEdit chiamato con:", r);
    setEdit({ ...r });
    setOpen(true);
    console.log("Stato impostato - open:", true, "edit:", { ...r });
  };

  // ✅ Funzione dedicata SOLO ad aggiornare lo stato locale del form
  const updateField = (key: string, value: any) => {
    if (!edit) return;
    setEdit({ ...edit, [key]: value });
  };

  // ✅ Funzione dedicata SOLO al salvataggio su Supabase
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;

    setSaving(true);
    try {
      // Rimuoviamo i campi virtuali che non esistono nel DB
      const { tour_type, ...restOfEdit } = edit;

      const payload = {
        ...restOfEdit,
        id: edit.id || crypto.randomUUID(),
        participants: edit.participants ? Number(edit.participants) : null,
        gdpr_consent: true,
        preferred_date: edit.preferred_date || null,
        alternative_date: edit.alternative_date || null,
      };

      const { error } = await (supabase.from("bookings") as any).upsert(payload, { onConflict: "id" });
      if (error) throw error;

      notify("success", "Prenotazione salvata");
      setOpen(false);
      load();
    } catch (e: any) {
      notify("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (r: Row, status: "contacted" | "confirmed" | "archived") => {
    try {
      const { error } = await (supabase.from("bookings") as any).update({ status }).eq("id", r.id);
      if (error) throw error;
      notify("success", `Stato aggiornato: ${STATUSES.find((s) => s.v === status)?.l}`);
      load();
    } catch (e: any) {
      notify("error", e.message);
    }
  };

  const onDelete = async (r: Row) => {
    if (!confirm("Eliminare la prenotazione? Questa azione non è reversibile.")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", r.id);
    if (error) notify("error", error.message);
    else {
      notify("success", "Prenotazione eliminata");
      load();
    }
  };

  const filtered = rows.filter((r: any) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.full_name?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s) ||
        r.preferred_destination?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const newCount = rows.filter((r: any) => r.status === "new").length;

  return (
    <PageHeader
      title="Prenotazioni &amp; Richieste"
      subtitle="Gestisci le richieste di visita e i preventivi inviati dai visitatori"
      icon={<CalendarCheck className="w-5 h-5" />}
    >
      <AdminTutorial
        title="Come gestire le Richieste e i Contatti con i Clienti"
        description="Qui arrivano tutte le richieste inviate tramite il modulo pubblico del sito. Puoi tracciare lo stato di avanzamento e salvare appunti interni."
        badge="Guida Richieste"
        steps={[
          { title: "1. Richieste Nuove", description: "Le richieste in arrivo sono evidenziate con un pallino rosso. Clicca sui link email o telefono per rispondere al cliente.", badge: "Pipeline" },
          { title: "2. Aggiornamento Stato", description: "Usa il menu Azioni (⋮) per cambiare rapidamente lo stato della prenotazione.", badge: "Stato" },
          { title: "3. Note Amministrative", description: "Nel dettaglio della prenotazione puoi inserire note interne riservate (acconti, preferenze, alberghi).", badge: "Note" },
        ]}
        tips={["Usa la barra di ricerca o i filtri di stato per trovare rapidamente una richiesta per nome, email o destinazione."]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#7A6655]">
              {filtered.length} di {rows.length} richieste
              {newCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B22A2A] text-white text-[10px] font-bold">
                  {newCount} NUOVE
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
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca nome, email..."
                className="pl-9 pr-3 py-1.5 text-sm border border-[#E9DCC4] rounded-sm bg-[#F9F4EC] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B22A2A]/30 focus:border-[#B22A2A]/40 w-56"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#92816A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C]">
            <Plus className="w-4 h-4" /> Nuova richiesta
          </button>
        </div>

        {loading ? null : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessuna prenotazione{filter !== "all" || search ? " corrispondente ai filtri" : ""}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F9F4EC] text-[#5C4C38] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Richiedente</th>
                  <th className="px-5 py-3 text-left font-semibold">Tour / Destinazione</th>
                  <th className="px-5 py-3 text-left font-semibold">Data</th>
                  <th className="px-5 py-3 text-left font-semibold">Dettagli</th>
                  <th className="px-5 py-3 text-left font-semibold">Note</th>
                  <th className="px-5 py-3 text-left font-semibold">Stato</th>
                  <th className="px-5 py-3 text-right font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8D6]">
                {filtered.map((r: any) => {
                  const st = STATUSES.find((s) => s.v === r.status) || STATUSES[0];
                  return (
                    <tr key={r.id} className={cn("hover:bg-[#F9F4EC]/60", r.status === "new" && "bg-[#B22A2A]/[0.02]")}>
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-semibold text-[#1E160A] flex items-center gap-1.5">
                          {r.full_name}
                          {r.status === "new" && <span className={cn("w-2 h-2 rounded-full animate-pulse", st.dot)} />}
                        </p>
                        <p className="text-xs text-[#7A6655] mt-0.5 flex items-center gap-1.5 truncate max-w-[240px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <a href={`mailto:${r.email}`} className="hover:underline truncate">{r.email}</a>
                        </p>
                        {r.phone && (
                          <p className="text-xs text-[#7A6655] mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="hover:underline">{r.phone}</a>
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        {r.tour_type ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm text-white inline-block mb-1" style={{ backgroundColor: r.tour_type.color }}>
                            {r.tour_type.name_it}
                          </span>
                        ) : null}
                        {r.preferred_destination && (
                          <p className="text-xs text-[#5C4C38] flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0 text-[#92816A]" />
                            {r.preferred_destination}
                          </p>
                        )}
                        {!r.tour_type && !r.preferred_destination && <span className="text-xs text-[#92816A]">—</span>}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        {r.preferred_date ? (
                          <p className="text-xs text-[#5C4C38] flex items-start gap-1">
                            <Clock className="w-3 h-3 mt-0.5 shrink-0 text-[#92816A]" />
                            <span>{formatDate(r.preferred_date)}</span>
                          </p>
                        ) : <span className="text-xs text-[#92816A]">Da definire</span>}
                        {r.alternative_date && <p className="text-[11px] text-[#92816A] mt-1 ml-4">alt: {formatDate(r.alternative_date)}</p>}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex flex-wrap gap-1">
                          {r.participants && <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sm bg-[#F0E8D6] text-[#5C4C38]"><Users className="w-3 h-3" /> {r.participants}</span>}
                          {r.visit_language && <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sm bg-[#F0E8D6] text-[#5C4C38]"><Languages className="w-3 h-3" /> {r.visit_language.toUpperCase()}</span>}
                          {r.transport && <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sm bg-[#F0E8D6] text-[#5C4C38]">{TRANSPORT_MAP[r.transport] || r.transport}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top max-w-[250px]">
                        {r.notes ? (
                          <div className="space-y-1">
                            <p className="text-[11px] text-[#5C4C38] line-clamp-3 italic">"{r.notes}"</p>
                            {r.admin_notes && <p className="text-[10px] text-[#92816A] line-clamp-2 border-t border-[#F0E8D6] pt-1 mt-1">📝 {r.admin_notes}</p>}
                          </div>
                        ) : r.admin_notes ? (
                          <p className="text-[10px] text-[#92816A] line-clamp-2">📝 {r.admin_notes}</p>
                        ) : <span className="text-xs text-[#C4B49A]">—</span>}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm inline-flex items-center gap-1", st.c)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.l}
                        </span>
                        <p className="text-[11px] text-[#92816A] mt-1">ricevuta {formatDate(r.created_at).split(" ")[0]}</p>
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        <ActionMenu booking={r} onStatusChange={quickStatus} onEdit={openEdit} onDelete={onDelete} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        edit={edit}
        tt={tt}
        transportModes={transportModes}
        saving={saving}
        onSubmit={onSubmit}
        updateField={updateField}
      />
    </PageHeader>
  );
}