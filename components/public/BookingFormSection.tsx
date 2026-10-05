"use client";

import { useState, useEffect, useRef } from "react";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import type { BookingPrefillData } from "@/lib/bookingPrefill";
import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { tFieldStr } from "@/lib/utils";
import {
  Calendar,
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  User,
  MapPin,
  Languages,
  Footprints,
  FileText,
  Sparkles,
  ShieldCheck,
  Clock,
  Award,
  Check,
  ChevronDown,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import supabase from "@/lib/supabase/browser";
import { renderIconByName } from "@/lib/icons";

type TourTypeT = Database["public"]["Tables"]["tour_types"]["Row"];
type TransportModeT = Database["public"]["Tables"]["transport_modes"]["Row"];

function formatDateDisplay(dateStr: string, lang: "it" | "en") {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BookingFormSection({
  tourTypes,
  defaultHidden = false,
}: {
  tourTypes: TourTypeT[];
  defaultHidden?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [transportModes, setTransportModes] = useState<TransportModeT[] | null>(null);

  // Controlled fields for prefill & state support
  const [tourTypeId, setTourTypeId] = useState("");
  const [destination, setDestination] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [altDate, setAltDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [transport, setTransport] = useState("");
  const [visitLang, setVisitLang] = useState<"it" | "en">(lang);
  const [notes, setNotes] = useState("");

  // Dropdown open states
  const [isTourTypeOpen, setIsTourTypeOpen] = useState(false);
  const [isTransportOpen, setIsTransportOpen] = useState(false);
  const tourTypeRef = useRef<HTMLDivElement>(null);
  const transportRef = useRef<HTMLDivElement>(null);

  // Sincronizza lingua della visita con la lingua attiva se l'utente non ha ancora interagito
  useEffect(() => {
    setVisitLang(lang);
  }, [lang]);

  // Chiudi dropdown al click esterno o ESC
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tourTypeRef.current && !tourTypeRef.current.contains(e.target as Node)) {
        setIsTourTypeOpen(false);
      }
      if (transportRef.current && !transportRef.current.contains(e.target as Node)) {
        setIsTransportOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTourTypeOpen(false);
        setIsTransportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  // Flag per animazione "flash" sul form dopo prefill
  const [prefillFlash, setPrefillFlash] = useState(false);
  const [prefillBadge, setPrefillBadge] = useState<{ destination?: string; tourTypeId?: string } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Ascolta l'evento davide:prefill-booking per pre-compilare il form
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent<BookingPrefillData>).detail;
      if (data.tourTypeId !== undefined) setTourTypeId(data.tourTypeId);
      if (data.destination !== undefined) setDestination(data.destination);
      if (data.preferredDate !== undefined) setPreferredDate(data.preferredDate);
      if (data.participants !== undefined) setParticipants(String(data.participants));
      if (data.transport !== undefined) setTransport(data.transport);
      if (data.notes !== undefined) setNotes(data.notes);

      // Salva badge di conferma visivo
      if (data.destination || data.tourTypeId) {
        setPrefillBadge({
          destination: data.destination,
          tourTypeId: data.tourTypeId,
        });
      }

      // Effetto flash e glow per segnalare all'utente il pre-fill
      setPrefillFlash(true);
      setTimeout(() => setPrefillFlash(false), 2400);
    };
    window.addEventListener("davide:prefill-booking", handler);
    return () => window.removeEventListener("davide:prefill-booking", handler);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await (supabase.from("transport_modes") as any)
          .select("*")
          .eq("is_active", true)
          .eq("is_available_for_booking", true)
          .order("sort_order");
        if (!error && alive) setTransportModes(data ?? []);
      } catch {
        /* fallback statico */
      }
    })();
    return () => { alive = false; };
  }, []);

  const displayTT = tourTypes.length > 0 ? tourTypes : FALLBACK_TT;
  const displayTransport = transportModes && transportModes.length > 0 ? transportModes : FALLBACK_TRANSPORT;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    if (!checked) {
      setErr(t("form.gdpr"));
      return;
    }
    setState("loading");
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: String(fd.get("full_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || null,
      tour_type_id: tourTypeId || null,
      preferred_destination: destination || null,
      visit_language: visitLang || fd.get("visit_language") || null,
      preferred_date: preferredDate || null,
      alternative_date: altDate || String(fd.get("alternative_date") ?? "") || null,
      participants: participants ? Number(participants) : null,
      transport: transport || fd.get("transport") || null,
      notes: notes || null,
      gdpr_consent: true,
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        if (json?.fields?.includes("email")) throw new Error(t("common.invalidEmail"));
        throw new Error(json?.error || t("form.error"));
      }
      setState("success");
      (e.target as HTMLFormElement).reset();
      setChecked(false);
      // Reset controlled fields
      setTourTypeId("");
      setDestination("");
      setPreferredDate("");
      setAltDate("");
      setParticipants("");
      setTransport("");
      setVisitLang(lang);
      setNotes("");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || t("form.error"));
      setState("error");
    }
  };

  const selectedTT = displayTT.find((tt) => tt.id === tourTypeId);
  const selectedTM = displayTransport.find((tm) => tm.slug === transport);
  const todayStr = new Date().toISOString().split("T")[0];

  // Il contenitore è a pillola (come gli altri campi): i bottoni interni usano rounded-full
  // così restano concentrici qualunque sia il raggio effettivo di rounded-lg nel tema
  const langBtn = (active: boolean) =>
    cn(
      "flex-1 h-full rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none",
      active
        ? "bg-[#9C1C1C] text-white shadow-xs font-bold"
        : "text-[#7A6655] hover:text-[#3D2B1F] hover:bg-black/5"
    );

  return (
    <section id="prenota" className="section scroll-mt-24 bg-[#F9F4EC] border-t border-black/5" style={defaultHidden ? { display: "none" } : undefined}>
      <div className="container-app max-w-6xl">
        <EditableSectionHeading
          section="Prenotazioni"
          subtitleKey="form.subtitle"
          titleKey="form.title"
          descKey="form.desc"
        />
        <div className="section-divider">
          <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
          <Sparkles className="w-4 h-4" style={{ color: "var(--color-stone)" }} />
          <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
        </div>

        <LiveEditSectionMask
          sectionId="prenota"
          adminHref="/admin/bookings"
          adminLabel="Prenotazioni"
          hint="Le richieste inviate dai clienti vengono ricevute e gestite in Prenotazioni nella Dashboard."
          defaultHidden={defaultHidden}
        >
          {/* Card Orizzontale Compatta - rounded-2xl uniforme con FAQ e resto del sito, senza overflow-hidden per evitare clipping dei dropdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/10 grid lg:grid-cols-12 relative">

            {/* Pannello Sinistro: Sfondo Rosso Profondo Harmonized con overflow-hidden per i blur interni */}
            <div
              className="lg:col-span-4 p-3.5 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl rounded-t-2xl lg:rounded-tr-none lg:rounded-bl-2xl"
              style={{
                background: "linear-gradient(135deg, #7E191B 0%, #4A0E10 100%)",
                color: "var(--text-white)",
              }}
            >
              {/* Sfondo decorativo soffuso */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: "var(--color-stone)", opacity: 0.15 }}
              />
              <div
                className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: "#9C1C1C", opacity: 0.25 }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between lg:block mb-2 sm:mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                      color: "#F2E3D5",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "#F2E3D5" }} />
                    {lang === "it" ? "Preventivo Gratuito" : "Free Custom Quote"}
                  </span>
                  <a
                    href="#contatti"
                    className="lg:hidden text-[10.5px] font-semibold underline inline-flex items-center gap-1"
                    style={{ color: "#F2E3D5" }}
                  >
                    <Phone className="w-3 h-3" />
                    {lang === "it" ? "Contatti diretti" : "Direct contacts"}
                  </a>
                </div>

                <h3
                  className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold leading-tight mb-1 sm:mb-3"
                  style={{ color: "var(--text-white)" }}
                >
                  {lang === "it" ? "Pianifichiamo la tua visita" : "Let's Plan Your Experience"}
                </h3>

                <p
                  className="hidden sm:block text-xs font-light leading-relaxed mb-3 sm:mb-6"
                  style={{ color: "rgba(255, 255, 255, 0.85)" }}
                >
                  {lang === "it"
                    ? "Compila il modulo con le tue preferenze. Riceverai una proposta su misura con programma e tariffe chiare."
                    : "Fill in the form with your travel details. You'll receive a tailored itinerary with transparent rates."}
                </p>

                {/* Punti di forza compatti */}
                <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-white/15">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderColor: "rgba(255, 255, 255, 0.25)",
                        color: "#F2E3D5",
                      }}
                    >
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                    <span>{lang === "it" ? "Risposta entro 24h" : "Reply within 24h"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderColor: "rgba(255, 255, 255, 0.25)",
                        color: "#F2E3D5",
                      }}
                    >
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                    <span>{lang === "it" ? "100% flessibile" : "100% flexible"}</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderColor: "rgba(255, 255, 255, 0.25)",
                        color: "#F2E3D5",
                      }}
                    >
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>{lang === "it" ? "Guida abilitata senza intermediari" : "Certified direct guide, no extra fees"}</span>
                  </div>
                </div>
              </div>

              {/* Box Contatto Diretto Rapido (Desktop) */}
              <div className="hidden lg:flex mt-6 pt-5 border-t border-white/15 relative z-10 text-[11px] items-center justify-between" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                <span>{lang === "it" ? "Hai urgenza?" : "Need urgent info?"}</span>
                <a
                  href="#contatti"
                  className="font-semibold underline inline-flex items-center gap-1 hover:text-white transition-colors"
                  style={{ color: "#F2E3D5" }}
                >
                  <Phone className="w-3 h-3" />
                  {lang === "it" ? "Contatti diretti" : "Direct contacts"}
                </a>
              </div>
            </div>

            {/* Pannello Destro: Form Orizzontale Compatto - nessun overflow-hidden per permettere ai popover di fluttuare */}
            <div className="lg:col-span-8 p-3 sm:p-7 md:p-10 flex flex-col justify-center rounded-b-2xl lg:rounded-bl-none lg:rounded-tr-2xl bg-white relative">
              {/* Banner Interattivo di Notifica Pre-selezione Tour/Esperienza */}
              {prefillBadge && (
                <div
                  className="mb-3 animate-fade-in-up border rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-xs"
                  style={{
                    backgroundColor: "rgba(156, 28, 28, 0.06)",
                    borderColor: "rgba(156, 28, 28, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: "rgba(156, 28, 28, 0.1)",
                        borderColor: "rgba(156, 28, 28, 0.3)",
                        color: "#9C1C1C",
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9.5px] uppercase tracking-wider font-bold block" style={{ color: "#9C1C1C" }}>
                        {lang === "it" ? "Esperienza pre-compilata nel modulo" : "Tour pre-selected in form"}
                      </span>
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#2B2018] truncate block">
                        {prefillBadge.destination || displayTT.find(t => t.id === prefillBadge.tourTypeId)?.name_it || "Tour selezionato"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrefillBadge(null);
                      setDestination("");
                      setTourTypeId("");
                    }}
                    className="text-[#72553F] hover:text-[#93161A] text-xs px-2 py-1 rounded-md hover:bg-black/5 transition-colors shrink-0 font-bold cursor-pointer"
                    title={lang === "it" ? "Rimuovi pre-selezione" : "Clear selection"}
                  >
                    ✕
                  </button>
                </div>
              )}

              <form
                ref={formRef}
                onSubmit={onSubmit}
                noValidate
                className={cn(
                  "space-y-3 sm:space-y-4 transition-all duration-500 rounded-xl relative",
                  prefillFlash && "ring-4 ring-[#9C1C1C]/40 shadow-2xl scale-[1.01] bg-[#9C1C1C]/5 p-2"
                )}
              >

                {/* RIGA 1: Dati Personali */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-start">
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1">
                      {t("form.name")} <span className="text-[#9C1C1C] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        name="full_name"
                        type="text"
                        placeholder={t("form.phName")}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1">
                      {t("form.email")} <span className="text-[#9C1C1C] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        name="email"
                        type="email"
                        placeholder={t("form.phEmail")}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1">
                      {t("form.phone")}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="phone"
                        type="tel"
                        placeholder={t("form.phPhone")}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGA 2: Scelta Itinerario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-start">
                  {/* Tipologia di Tour con Dropdown personalizzato ed esaustivo */}
                  <div className={cn("flex flex-col relative", isTourTypeOpen ? "z-30" : "z-20")} ref={tourTypeRef}>
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1">
                      {t("form.category")} <span className="text-[#9C1C1C] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {selectedTT ? (
                          renderIconByName(selectedTT.icon, { className: "w-3.5 h-3.5 text-[#9C1C1C]" }, Compass)
                        ) : (
                          <Compass className="w-3.5 h-3.5 text-[#92816A]" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTourTypeOpen((v) => !v);
                          setIsTransportOpen(false);
                        }}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-6 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors text-left flex items-center justify-between cursor-pointer"
                        aria-haspopup="listbox"
                        aria-expanded={isTourTypeOpen}
                      >
                        <span className={cn("truncate", selectedTT ? "font-semibold text-[#3D2B1F]" : "text-[#92816A]")}>
                          {selectedTT ? tFieldStr(selectedTT as any, "name", lang) : `— ${lang === "it" ? "Tipologia" : "Tour type"} —`}
                        </span>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-[#92816A] shrink-0 transition-transform duration-200", isTourTypeOpen && "rotate-180")} />
                      </button>

                      {/* Hidden input per submit del form con validazione */}
                      <input type="hidden" name="tour_type_id" value={tourTypeId} required />

                      {/* Dropdown Popover (rounded-xl: 12px - p-1.5 6px - bordo 1px ≈ 5px, vicino ai rounded-md interni) */}
                      {isTourTypeOpen && (
                        <div className="absolute top-full left-0 w-[280px] sm:w-[320px] max-w-[calc(100vw-36px)] mt-1.5 z-50 bg-white border border-[#E9DCC4] rounded-xl shadow-xl p-1.5 max-h-72 overflow-y-auto space-y-1 animate-dropdown">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#92816A] border-b border-black/5">
                            {lang === "it" ? "Seleziona tipologia tour" : "Select tour type"}
                          </div>
                          {displayTT.map((tt) => {
                            const isSelected = tt.id === tourTypeId;
                            const desc = tFieldStr(tt as any, "description", lang);
                            return (
                              <button
                                key={tt.id}
                                type="button"
                                onClick={() => {
                                  setTourTypeId(tt.id);
                                  setIsTourTypeOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded-md transition-all flex items-start gap-2.5 cursor-pointer",
                                  isSelected
                                    ? "bg-[#9C1C1C]/8 border border-[#9C1C1C]/25"
                                    : "hover:bg-[#F9F4EC] border border-transparent"
                                )}
                              >
                                <span
                                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                                  style={{
                                    backgroundColor: `${tt.color || "#9C1C1C"}15`,
                                    color: tt.color || "#9C1C1C",
                                  }}
                                >
                                  {renderIconByName(tt.icon, { className: "w-3.5 h-3.5" }, Compass)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={cn("text-xs font-bold truncate", isSelected ? "text-[#9C1C1C]" : "text-[#3D2B1F]")}>
                                      {tFieldStr(tt as any, "name", lang)}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#9C1C1C] shrink-0" />}
                                  </div>
                                  {desc && (
                                    <p className="text-[10.5px] text-[#7A6655] leading-snug mt-0.5">
                                      {desc}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destinazione Preferita */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1">
                      {t("form.destination")}
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="preferred_destination"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                        placeholder={lang === "it" ? "es. Venezia, Asiago..." : "e.g. Venice, Asiago..."}
                      />
                    </div>
                  </div>

                  {/* Lingua della visita (Segmented Selector moderno) */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center justify-between mb-1">
                      <span>{t("form.visitLang")}</span>
                      <span className="text-[9.5px] font-normal text-[#92816A] lowercase">
                        {visitLang === "it" ? "in italiano" : "in english"}
                      </span>
                    </label>
                    <div className="flex items-center p-1 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg h-9 sm:h-10 gap-1 transition-colors">
                      <button
                        type="button"
                        onClick={() => setVisitLang("it")}
                        className={langBtn(visitLang === "it")}
                      >
                        <span className="text-xs leading-none">🇮🇹</span>
                        <span>Italiano</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitLang("en")}
                        className={langBtn(visitLang === "en")}
                      >
                        <span className="text-xs leading-none">🇬🇧</span>
                        <span>English</span>
                      </button>
                    </div>
                    <input type="hidden" name="visit_language" value={visitLang} />
                  </div>
                </div>

                {/* RIGA 3: Date, Partecipanti & Modalità di Spostamento - Allineamento perfetto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 items-start">
                  {/* Data Preferita */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1 truncate">
                      {t("form.datePref")}
                    </label>
                    <div className="relative flex items-center w-full h-9 sm:h-10 pl-2.5 sm:pl-3 pr-2 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus-within:border-[#9C1C1C] focus-within:bg-white hover:border-[#9C1C1C]/40 transition-colors cursor-pointer group">
                      <Calendar className="w-3.5 h-3.5 text-[#92816A] group-hover:text-[#9C1C1C] transition-colors shrink-0 mr-2 pointer-events-none" />
                      <span
                        className={cn(
                          "text-xs font-sans truncate flex-1 select-none pointer-events-none",
                          preferredDate ? "font-semibold text-[#3D2B1F]" : "text-[#92816A]"
                        )}
                      >
                        {preferredDate ? formatDateDisplay(preferredDate, lang) : (lang === "it" ? "gg/mm/aaaa" : "dd/mm/yyyy")}
                      </span>

                      {preferredDate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setPreferredDate("");
                          }}
                          className="relative z-20 w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center text-[#92816A] hover:text-[#9C1C1C] transition-colors cursor-pointer text-xs leading-none shrink-0"
                          title={lang === "it" ? "Cancella data" : "Clear date"}
                        >
                          ✕
                        </button>
                      )}

                      <input
                        name="preferred_date"
                        type="date"
                        min={todayStr}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            (e.currentTarget as any).showPicker?.();
                          } catch { }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label={t("form.datePref")}
                      />
                    </div>
                  </div>

                  {/* Data Alternativa */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1 truncate">
                      {lang === "it" ? "Data Alt." : "Alt. Date"}
                    </label>
                    <div className="relative flex items-center w-full h-9 sm:h-10 pl-2.5 sm:pl-3 pr-2 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus-within:border-[#9C1C1C] focus-within:bg-white hover:border-[#9C1C1C]/40 transition-colors cursor-pointer group">
                      <Calendar className="w-3.5 h-3.5 text-[#92816A] group-hover:text-[#9C1C1C] transition-colors shrink-0 mr-2 pointer-events-none" />
                      <span
                        className={cn(
                          "text-xs font-sans truncate flex-1 select-none pointer-events-none",
                          altDate ? "font-semibold text-[#3D2B1F]" : "text-[#92816A]"
                        )}
                      >
                        {altDate ? formatDateDisplay(altDate, lang) : (lang === "it" ? "gg/mm/aaaa" : "dd/mm/yyyy")}
                      </span>

                      {altDate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setAltDate("");
                          }}
                          className="relative z-20 w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center text-[#92816A] hover:text-[#9C1C1C] transition-colors cursor-pointer text-xs leading-none shrink-0"
                          title={lang === "it" ? "Cancella data" : "Clear date"}
                        >
                          ✕
                        </button>
                      )}

                      <input
                        name="alternative_date"
                        type="date"
                        min={preferredDate || todayStr}
                        value={altDate}
                        onChange={(e) => setAltDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            (e.currentTarget as any).showPicker?.();
                          } catch { }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label={lang === "it" ? "Data Alternativa" : "Alternative Date"}
                      />
                    </div>
                  </div>

                  {/* Partecipanti con stepper compatto */}
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1 truncate">
                      {t("form.participants")}
                    </label>
                    <div className="flex items-center bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg overflow-hidden focus-within:border-[#9C1C1C] focus-within:bg-white transition-colors h-9 sm:h-10 px-1">
                      <Users className="w-3.5 h-3.5 text-[#92816A] shrink-0 ml-1.5 pointer-events-none" />
                      <input
                        name="participants"
                        type="hidden"
                        value={participants}
                      />
                      <button
                        type="button"
                        aria-label="Diminuisci partecipanti"
                        onClick={() => setParticipants((v) => String(Math.max(1, Number(v || 1) - 1)))}
                        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 ml-1 rounded-md text-[#9C1C1C] bg-[#9C1C1C]/8 hover:bg-[#9C1C1C]/15 active:bg-[#9C1C1C]/25 transition-colors text-base font-bold leading-none select-none shrink-0 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-xs font-sans font-semibold text-[#3D2B1F] select-none min-w-[2ch]">
                        {participants || "1"}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumenta partecipanti"
                        onClick={() => setParticipants((v) => String(Math.min(100, Number(v || 1) + 1)))}
                        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-1 rounded-md text-[#9C1C1C] bg-[#9C1C1C]/8 hover:bg-[#9C1C1C]/15 active:bg-[#9C1C1C]/25 transition-colors text-base font-bold leading-none select-none shrink-0 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Modalità di Spostamento con spiegazione e slug visibili */}
                  <div className={cn("flex flex-col relative", isTransportOpen ? "z-30" : "z-20")} ref={transportRef}>
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] h-5 flex items-center mb-1 truncate">
                      {lang === "it" ? "Spostamento" : "Transport"}
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {selectedTM ? (
                          <span style={{ color: selectedTM.color || "#9C1C1C" }}>
                            {renderIconByName(selectedTM.icon_name, { className: "w-3.5 h-3.5" }, Footprints)}
                          </span>
                        ) : (
                          <Footprints className="w-3.5 h-3.5 text-[#92816A]" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTransportOpen((v) => !v);
                          setIsTourTypeOpen(false);
                        }}
                        className="w-full h-9 sm:h-10 text-xs pl-8 sm:pl-9 pr-6 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors text-left flex items-center justify-between cursor-pointer"
                        aria-haspopup="listbox"
                        aria-expanded={isTransportOpen}
                      >
                        <span className={cn("truncate", selectedTM ? "font-semibold text-[#3D2B1F]" : "text-[#92816A]")}>
                          {selectedTM ? (lang === "it" ? selectedTM.name_it : selectedTM.name_en) : `— ${lang === "it" ? "Mezzo" : "Mode"} —`}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {selectedTM && (
                            <span className="font-mono text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 text-[#7A6655] hidden xs:inline-block">
                              {selectedTM.slug}
                            </span>
                          )}
                          <ChevronDown className={cn("w-3.5 h-3.5 text-[#92816A] shrink-0 transition-transform duration-200", isTransportOpen && "rotate-180")} />
                        </div>
                      </button>

                      {/* Hidden input per submit del form */}
                      <input type="hidden" name="transport" value={transport} />

                      {/* Dropdown Popover con spiegazione e slug per ogni modalità */}
                      {isTransportOpen && (
                        <div className="absolute top-full right-0 w-[285px] sm:w-[340px] md:w-[370px] max-w-[calc(100vw-36px)] mt-1.5 z-50 bg-white border border-[#E9DCC4] rounded-xl shadow-xl p-1.5 max-h-80 overflow-y-auto space-y-1 animate-dropdown">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#92816A] border-b border-black/5 flex items-center justify-between">
                            <span>{lang === "it" ? "Modalità di spostamento" : "Transport mode"}</span>
                            <span className="font-mono text-[9px] lowercase bg-black/5 px-1.5 py-0.5 rounded-md text-[#7A6655]">slug</span>
                          </div>

                          {displayTransport.map((tm) => {
                            const isSelected = tm.slug === transport;
                            const desc = getTransportDescription(tm, lang);
                            return (
                              <button
                                key={tm.slug}
                                type="button"
                                onClick={() => {
                                  setTransport(tm.slug);
                                  setIsTransportOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded-md transition-all flex items-start gap-2.5 cursor-pointer",
                                  isSelected
                                    ? "bg-[#9C1C1C]/8 border border-[#9C1C1C]/25"
                                    : "hover:bg-[#F9F4EC] border border-transparent"
                                )}
                              >
                                <span
                                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                                  style={{
                                    backgroundColor: `${tm.color || "#9C1C1C"}15`,
                                    color: tm.color || "#9C1C1C",
                                  }}
                                >
                                  {renderIconByName(tm.icon_name, { className: "w-3.5 h-3.5" }, Footprints)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className={cn("text-xs font-bold truncate", isSelected ? "text-[#9C1C1C]" : "text-[#3D2B1F]")}>
                                      {lang === "it" ? tm.name_it : tm.name_en}
                                    </span>
                                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md bg-black/5 text-[#7A6655] shrink-0">
                                      {tm.slug}
                                    </span>
                                  </div>
                                  {desc && (
                                    <p className="text-[11px] text-[#7A6655] leading-snug mt-0.5">
                                      {desc}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#9C1C1C] shrink-0 mt-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info strip della modalità selezionata - posizionata sotto la riga senza disallineare i campi */}
                {selectedTM && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F9F4EC] border border-[#E9DCC4] text-[11px] text-[#7A6655] animate-dropdown">
                    <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#9C1C1C]/10 text-[#9C1C1C] shrink-0">
                      {selectedTM.slug}
                    </span>
                    <span className="font-semibold text-[#3D2B1F] shrink-0">
                      {lang === "it" ? selectedTM.name_it : selectedTM.name_en}:
                    </span>
                    <span className="truncate">
                      {getTransportDescription(selectedTM, lang)}
                    </span>
                  </div>
                )}

                {/* RIGA 4: Note / Richieste particolari */}
                <div>
                  <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#9C1C1C]" />
                    {t("form.notes")}
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2 sm:p-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-lg focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors resize-y leading-relaxed"
                    placeholder={t("form.phNotes")}
                  />
                </div>

                {/* GDPR Checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="gdpr-check"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setChecked(e.target.checked);
                      if (e.target.checked && err === t("form.gdpr")) setErr("");
                    }}
                    className="mt-0.5 w-3.5 h-3.5 text-[#9C1C1C] border-[#C4B49A] rounded-xs focus:ring-[#9C1C1C] cursor-pointer shrink-0"
                  />
                  <label htmlFor="gdpr-check" className="text-[11px] text-[#7A6655] cursor-pointer leading-tight">
                    <span className="text-[#9C1C1C] font-bold">* </span>
                    {lang === "it"
                      ? "Autorizzo il trattamento dei dati personali ai sensi del GDPR per ricevere il preventivo richiesto."
                      : "I authorize the processing of my personal data under GDPR exclusively to receive this quote."}
                  </label>
                </div>

                {/* Messaggi di Stato */}
                {state === "success" && (
                  <div className="bg-[#4A6535]/15 border border-[#4A6535]/40 text-[#2F4220] p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4A6535] shrink-0" />
                    <span>{t("form.success")}</span>
                  </div>
                )}
                {state === "error" && (
                  <div className="bg-[#9C1C1C]/15 border border-[#9C1C1C]/40 text-[#9C1C1C] p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#9C1C1C] shrink-0" />
                    <span>{err || t("form.error")}</span>
                  </div>
                )}

                {/* RIGA SUBMIT FOOTER */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/5">
                  <p className="text-[11px] text-[#92816A] flex items-center gap-1.5 font-light">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4A6535]" />
                    {lang === "it" ? "Dati protetti e riservati." : "Your data is strictly confidential."}
                  </p>

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#9C1C1C] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#6E1212] shadow-sm transition-all cursor-pointer",
                      state === "loading" && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {state === "loading" ? t("form.submitting") : t("form.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </LiveEditSectionMask>
      </div>
    </section>
  );
}

const FALLBACK_TT: TourTypeT[] = [
  {
    id: "tt_1",
    slug: "citta-d-arte",
    name_it: "Città d'Arte",
    name_en: "Art Cities",
    description_it: "Venezia, Padova, Vicenza, Treviso, Verona e Trento.",
    description_en: "Venice, Padua, Vicenza, Treviso, Verona and Trent.",
    color: "#3D6E90",
    icon: "Landmark",
    is_active: true,
    is_exclusive: false,
    is_custom_tour: false,
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "tt_2",
    slug: "ville-venete",
    name_it: "Ville Venete & Castelli",
    name_en: "Venetian Villas & Castles",
    description_it: "Palladio, Ville Venete e Castelli del Trentino.",
    description_en: "Palladio, Venetian Villas and Alpine Castles.",
    color: "#4A6535",
    icon: "Castle",
    is_active: true,
    is_exclusive: false,
    is_custom_tour: false,
    sort_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "tt_3",
    slug: "grande-guerra",
    name_it: "La Grande Guerra 1915-1918",
    name_en: "World War I 1915-1918",
    description_it: "Altopiano di Asiago, Lavarone e Luserna.",
    description_en: "Asiago Plateau, Lavarone and Luserna.",
    color: "#9C1C1C",
    icon: "Compass",
    is_active: true,
    is_exclusive: false,
    is_custom_tour: false,
    sort_order: 3,
    created_at: "",
    updated_at: "",
  },
  {
    id: "tt_4",
    slug: "su-misura",
    name_it: "Tour Personalizzato / Su Misura",
    name_en: "Tailor-made Custom Tour",
    description_it: "Itinerario costruito sulle tue esigenze.",
    description_en: "Itinerary crafted around your schedule and desires.",
    color: "#C4923A",
    icon: "Sparkles",
    is_active: true,
    is_exclusive: false,
    is_custom_tour: true,
    sort_order: 4,
    created_at: "",
    updated_at: "",
  },
];

function getTransportDescription(tm: TransportModeT, currentLang: "it" | "en"): string {
  const fromDb = currentLang === "it" ? tm.description_it : tm.description_en;
  if (fromDb && fromDb.trim()) return fromDb;
  const fallback = FALLBACK_TRANSPORT.find((f) => f.slug === tm.slug);
  return fallback ? (currentLang === "it" ? fallback.description_it || "" : fallback.description_en || "") : "";
}

const FALLBACK_TRANSPORT: TransportModeT[] = [
  {
    id: "tm_walk", slug: "walk",
    name_it: "A piedi", name_en: "On foot",
    description_it: "Tour pedonali nel centro storico, monumenti e passeggiate a passo lento",
    description_en: "Walking tours in historic centers, monuments and slow-paced strolls",
    icon_name: "Footprints", color: "#4A6535",
    sort_order: 0, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_bike", slug: "bike",
    name_it: "In Bicicletta / E-Bike", name_en: "Bicycle / E-Bike",
    description_it: "Itinerari cicloturistici su due ruote tra natura, colline e ciclabili",
    description_en: "Two-wheeled cycling routes across nature, hills and bike trails",
    icon_name: "Bike", color: "#3D6E90",
    sort_order: 1, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_moto", slug: "moto",
    name_it: "In Moto / Scooter", name_en: "Motorcycle / Scooter",
    description_it: "Percorsi panoramici tra passi montani, colli e grandi vallate",
    description_en: "Scenic motorcycle routes across mountain passes and scenic valleys",
    icon_name: "Car", color: "#9C1C1C",
    sort_order: 2, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_car", slug: "car",
    name_it: "In Automobile propria", name_en: "By Private Car",
    description_it: "Tour con auto propria tra borghi e località più distanti",
    description_en: "Tours with private vehicle between distant destinations and villages",
    icon_name: "CarFront", color: "#7A6655",
    sort_order: 3, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_bus", slug: "bus",
    name_it: "Pullman / Gruppo Organizzato", name_en: "Bus / Organized Group",
    description_it: "Itinerari per comitive, scolaresche e gruppi turistici con pullman",
    description_en: "Itineraries for large groups, schools and coach bus tour parties",
    icon_name: "Bus", color: "#C4923A",
    sort_order: 4, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
];