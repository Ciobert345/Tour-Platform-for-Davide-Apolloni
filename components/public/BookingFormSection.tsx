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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import supabase from "@/lib/supabase/browser";

type TourTypeT = Database["public"]["Tables"]["tour_types"]["Row"];
type TransportModeT = Database["public"]["Tables"]["transport_modes"]["Row"];

export default function BookingFormSection({
  tourTypes,
}: {
  tourTypes: TourTypeT[];
}) {
  const t = useT();
  const { lang } = useLang();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [transportModes, setTransportModes] = useState<TransportModeT[] | null>(null);

  // Controlled fields for prefill support
  const [tourTypeId, setTourTypeId] = useState("");
  const [destination, setDestination] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");

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
      visit_language: fd.get("visit_language") ?? null,
      preferred_date: preferredDate || null,
      alternative_date: String(fd.get("alternative_date") ?? "") || null,
      participants: participants ? Number(participants) : null,
      transport: fd.get("transport") ?? null,
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
      setParticipants("");
      setNotes("");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || t("form.error"));
      setState("error");
    }
  };

  return (
    <section id="prenota" className="section scroll-mt-24 bg-[#F9F4EC] border-t border-black/5">
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
          adminHref="/admin/bookings"
          adminLabel="Prenotazioni"
          hint="Le richieste inviate dai clienti vengono ricevute e gestite in Prenotazioni nella Dashboard."
        >
          {/* Card Orizzontale Compatta */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden grid lg:grid-cols-12">

            {/* Pannello Sinistro: Sfondo Rosso Profondo Harmonized */}
            <div
              className="lg:col-span-4 p-3.5 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border"
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
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 border"
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
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 border"
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
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
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

            {/* Pannello Destro: Form Orizzontale Compatto */}
            <div className="lg:col-span-8 p-3 sm:p-7 md:p-10 flex flex-col justify-center">
              {/* Banner Interattivo di Notifica Pre-selezione Tour/Esperienza */}
              {prefillBadge && (
                <div
                  className="mb-3 animate-fade-in-up border rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-xs"
                  style={{
                    backgroundColor: "rgba(156, 28, 28, 0.06)",
                    borderColor: "rgba(156, 28, 28, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border"
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
                    className="text-[#72553F] hover:text-[#93161A] text-xs px-2 py-1 rounded-lg hover:bg-black/5 transition-colors shrink-0 font-bold cursor-pointer"
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
                  "space-y-2.5 sm:space-y-4 transition-all duration-500 rounded-2xl",
                  prefillFlash && "ring-4 ring-[#9C1C1C]/40 shadow-2xl scale-[1.01] bg-[#9C1C1C]/5 p-2"
                )}
              >

                {/* RIGA 1: Dati Personali */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 items-end">
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.name")} <span className="text-[#9C1C1C]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        name="full_name"
                        type="text"
                        placeholder={t("form.phName")}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.email")} <span className="text-[#9C1C1C]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        name="email"
                        type="email"
                        placeholder={t("form.phEmail")}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.phone")}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="phone"
                        type="tel"
                        placeholder={t("form.phPhone")}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGA 2: Scelta Itinerario */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 items-end">
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.category")} <span className="text-[#9C1C1C]">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        required
                        name="tour_type_id"
                        value={tourTypeId}
                        onChange={(e) => setTourTypeId(e.target.value)}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-5 sm:pr-6 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled>
                          — {lang === "it" ? "Tipologia" : "Tour type"} —
                        </option>
                        {displayTT.map((tt) => (
                          <option key={tt.id} value={tt.id}>
                            {tFieldStr(tt as any, "name", lang)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.destination")}
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="preferred_destination"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                        placeholder={lang === "it" ? "es. Venezia, Asiago..." : "e.g. Venice, Asiago..."}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-0.5 sm:mb-1">
                      {t("form.visitLang")}
                    </label>
                    <div className="relative">
                      <Languages className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        name="visit_language"
                        defaultValue={lang}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-5 sm:pr-6 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="it">{t("form.langIt")}</option>
                        <option value="en">{t("form.langEn")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* RIGA 3: Date, Partecipanti & Mezzo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 items-end">
                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1">
                      {t("form.datePref")}
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="preferred_date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-1 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1">
                      {lang === "it" ? "Data Alt." : "Alt. Date"}
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="alternative_date"
                        type="date"
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-1 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1">
                      {t("form.participants")}
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="participants"
                        type="number"
                        min={1}
                        max={100}
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                        placeholder="es. 4"
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1">
                      {t("form.transport")}
                    </label>
                    <div className="relative">
                      <Footprints className="w-3.5 h-3.5 text-[#92816A] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        name="transport"
                        defaultValue=""
                        className="w-full text-xs py-1.5 sm:py-2 pl-8 sm:pl-9 pr-5 sm:pr-6 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled>— {lang === "it" ? "Mezzo" : "Mode"} —</option>
                        {displayTransport.map((tm) => (
                          <option key={tm.slug} value={tm.slug}>
                            {lang === "it" ? tm.name_it : tm.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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
                    className="w-full text-xs p-2 sm:p-2.5 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-xl focus:bg-white focus:border-[#9C1C1C] focus:outline-none transition-colors resize-y leading-relaxed"
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
                  <div className="bg-[#4A6535]/15 border border-[#4A6535]/40 text-[#2F4220] p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4A6535] shrink-0" />
                    <span>{t("form.success")}</span>
                  </div>
                )}
                {state === "error" && (
                  <div className="bg-[#9C1C1C]/15 border border-[#9C1C1C]/40 text-[#9C1C1C] p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
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
                      "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#9C1C1C] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#6E1212] shadow-sm transition-all cursor-pointer",
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

const FALLBACK_TRANSPORT: TransportModeT[] = [
  {
    id: "tm_walk", slug: "walk",
    name_it: "A piedi", name_en: "On foot",
    description_it: "", description_en: "",
    icon_name: "Footprints", color: "#4A6535",
    sort_order: 0, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_bike", slug: "bike",
    name_it: "In Bicicletta / E-Bike", name_en: "Bicycle / E-Bike",
    description_it: "", description_en: "",
    icon_name: "Bike", color: "#3D6E90",
    sort_order: 1, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_moto", slug: "moto",
    name_it: "In Moto / Scooter", name_en: "Motorcycle / Scooter",
    description_it: "", description_en: "",
    icon_name: "Car", color: "#9C1C1C",
    sort_order: 2, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_car", slug: "car",
    name_it: "In Automobile propria", name_en: "By Private Car",
    description_it: "", description_en: "",
    icon_name: "CarFront", color: "#7A6655",
    sort_order: 3, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
  {
    id: "tm_bus", slug: "bus",
    name_it: "Pullman / Gruppo Organizzato", name_en: "Bus / Organized Group",
    description_it: "", description_en: "",
    icon_name: "Bus", color: "#C4923A",
    sort_order: 4, is_active: true,
    is_available_for_booking: true, is_available_for_places: true,
    created_at: "", updated_at: "",
  },
];