"use client";

import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import type { BookingPrefillData } from "@/lib/bookingPrefill";
import { readBookingQueryParams } from "@/lib/bookingPrefill";
import { cn, tFieldStr } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import { AlertTriangle, CheckCircle2, Send, ShieldCheck } from "lucide-react";

type TourTypeT = Database["public"]["Tables"]["tour_types"]["Row"];

export type MapBookingFields = {
  source: "form" | "map";
  mapLat: number | null;
  mapLng: number | null;
  placeId: string | null;
  mapSpotId: string | null;
};

export default function BookingForm({
  tourTypes,
  initialPrefill,
  listenGlobalPrefill = true,
  readUrlParams = false,
  onSuccess,
  idPrefix = "book",
}: {
  tourTypes: TourTypeT[];
  initialPrefill?: BookingPrefillData;
  listenGlobalPrefill?: boolean;
  readUrlParams?: boolean;
  onSuccess?: () => void;
  idPrefix?: string;
}) {
  const t = useT();
  const { lang } = useLang();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState("");
  const [checked, setChecked] = useState(false);
  const [tourTypeId, setTourTypeId] = useState(initialPrefill?.tourTypeId ?? "");
  const [destination, setDestination] = useState(initialPrefill?.destination ?? "");
  const [preferredDate, setPreferredDate] = useState(initialPrefill?.preferredDate ?? "");
  const [altDate, setAltDate] = useState("");
  const [participants, setParticipants] = useState(initialPrefill?.participants ? String(initialPrefill.participants) : "2");
  const [transport, setTransport] = useState(initialPrefill?.transport ?? "");
  const [visitLang, setVisitLang] = useState<"it" | "en">(lang);
  const [notes, setNotes] = useState(initialPrefill?.notes ?? "");
  const [mapFields, setMapFields] = useState<MapBookingFields>({
    source: initialPrefill?.source ?? "form",
    mapLat: initialPrefill?.mapLat ?? null,
    mapLng: initialPrefill?.mapLng ?? null,
    placeId: initialPrefill?.placeId ?? null,
    mapSpotId: initialPrefill?.mapSpotId ?? null,
  });

  useEffect(() => { setVisitLang(lang); }, [lang]);

  useEffect(() => {
    if (!readUrlParams || typeof window === "undefined") return;
    const q = readBookingQueryParams(window.location.search);
    if (!q) return;
    applyPrefill(q);
  }, [readUrlParams]);

  const applyPrefill = (data: BookingPrefillData) => {
    if (data.tourTypeId !== undefined) setTourTypeId(data.tourTypeId);
    if (data.destination !== undefined) setDestination(data.destination);
    if (data.preferredDate !== undefined) setPreferredDate(data.preferredDate);
    if (data.participants !== undefined) setParticipants(String(data.participants));
    if (data.transport !== undefined) setTransport(data.transport);
    if (data.notes !== undefined) setNotes(data.notes);
    setMapFields((prev) => ({
      source: data.source ?? prev.source,
      mapLat: data.mapLat !== undefined ? data.mapLat ?? null : prev.mapLat,
      mapLng: data.mapLng !== undefined ? data.mapLng ?? null : prev.mapLng,
      placeId: data.placeId !== undefined ? data.placeId ?? null : prev.placeId,
      mapSpotId: data.mapSpotId !== undefined ? data.mapSpotId ?? null : prev.mapSpotId,
    }));
  };

  useEffect(() => {
    if (!listenGlobalPrefill) return;
    const handler = (e: Event) => applyPrefill((e as CustomEvent<BookingPrefillData>).detail);
    window.addEventListener("davide:prefill-booking", handler);
    return () => window.removeEventListener("davide:prefill-booking", handler);
  }, [listenGlobalPrefill]);

  const inputCls =
    "w-full h-10 text-xs px-3 bg-[#F9F4EC]/75 dark:bg-[#2b2218] border border-[#E9DCC4] dark:border-white/15 rounded-lg text-[#1E160A] dark:text-[#fdf9f2] focus:outline-none focus:border-[#9C1C1C]";
  const labelCls = "text-[11px] font-bold uppercase tracking-wider text-[#7A6655] mb-1 block";

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
      visit_language: visitLang,
      preferred_date: preferredDate || null,
      alternative_date: altDate || null,
      participants: participants ? Number(participants) : null,
      transport: transport || null,
      notes: notes || null,
      gdpr_consent: true,
      source: mapFields.source,
      map_lat: mapFields.mapLat,
      map_lng: mapFields.mapLng,
      place_id: mapFields.placeId,
      map_spot_id: mapFields.mapSpotId,
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || t("form.error"));
      setState("success");
      (e.target as HTMLFormElement).reset();
      setChecked(false);
      setNotes("");
      onSuccess?.();
    } catch (ex) {
      setErr((ex as Error).message || t("form.error"));
      setState("error");
    }
  };

  const hasMapPlace = mapFields.mapLat != null && mapFields.mapLng != null;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3" noValidate>
      {hasMapPlace && (
        <div className="rounded-lg border border-[#9C1C1C]/25 bg-[#9C1C1C]/10 p-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9C1C1C]">{t("map.selectedPlace")}</p>
            <p className="text-sm font-serif font-bold">{destination || t("map.placeUnknown")}</p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#7A6655] hover:text-[#9C1C1C]"
            onClick={() => {
              setMapFields({ source: "form", mapLat: null, mapLng: null, placeId: null, mapSpotId: null });
            }}
          >
            {t("map.removeSelected")}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t("form.name")} *</label>
          <input required name="full_name" minLength={2} className={inputCls} placeholder={t("form.phName")} />
        </div>
        <div>
          <label className={labelCls}>{t("form.email")} *</label>
          <input required name="email" type="email" className={inputCls} placeholder={t("form.phEmail")} />
        </div>
        <div>
          <label className={labelCls}>{t("form.phone")}</label>
          <input name="phone" type="tel" className={inputCls} placeholder={t("form.phPhone")} />
        </div>
        <div>
          <label className={labelCls}>{t("form.category")}</label>
          <select className={inputCls} value={tourTypeId} onChange={(e) => setTourTypeId(e.target.value)}>
            <option value="">—</option>
            {tourTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>{tFieldStr(tt as never, "name", lang)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>{t("form.destination")}</label>
          <input className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>{t("form.datePref")}</label>
          <input type="date" className={inputCls} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>{t("form.participants")}</label>
          <input type="number" min={1} max={100} className={inputCls} value={participants} onChange={(e) => setParticipants(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("form.notes")}</label>
        <textarea rows={3} className={cn(inputCls, "h-auto py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-start gap-2">
        <input
          id={`${idPrefix}-gdpr`}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5"
        />
        <label htmlFor={`${idPrefix}-gdpr`} className="text-[11px] text-[#7A6655]">{t("form.gdpr")}</label>
      </div>
      {state === "success" && (
        <p className="text-xs font-semibold text-[#2F4220] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{t("form.success")}</p>
      )}
      {state === "error" && (
        <p className="text-xs font-semibold text-[#9C1C1C] flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{err || t("form.error")}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-[#92816A] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#4A6535]" />{lang === "it" ? "Dati protetti." : "Confidential."}</p>
        <button type="submit" disabled={state === "loading"} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9C1C1C] text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60">
          <Send className="w-3.5 h-3.5" />
          {state === "loading" ? t("form.submitting") : t("form.submit")}
        </button>
      </div>
    </form>
  );
}
