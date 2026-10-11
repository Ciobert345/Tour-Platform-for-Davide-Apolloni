"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PageHeader, Field, Grid2 } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import TranslateButton from "@/components/admin/TranslateButton";
import CoordPicker from "@/components/admin/CoordPicker";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import AdminTutorial from "@/components/admin/AdminTutorial";
import MapSectionToggle from "@/components/admin/MapSectionToggle";
import {
  MapPinned, Plus, Edit2, Trash2, Loader2, X, AlertCircle, CheckCircle2, Image as ImageIcon,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { formatDbError } from "@/lib/utils";
import { translateLongText } from "@/lib/translateClient";
import Image from "next/image";

type Row = Record<string, unknown> & {
  id?: string;
  slug?: string;
  name_it?: string;
  name_en?: string;
  short_description_it?: string;
  short_description_en?: string;
  long_description_it?: string;
  long_description_en?: string;
  lat?: number | null;
  lng?: number | null;
  cover_image_url?: string | null;
  tour_type_id?: string | null;
  place_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

const DEF: Row = {
  id: undefined,
  slug: "",
  name_it: "",
  name_en: "",
  short_description_it: "",
  short_description_en: "",
  long_description_it: "",
  long_description_en: "",
  lat: 45.4064,
  lng: 11.8768,
  cover_image_url: "",
  tour_type_id: null,
  place_id: null,
  sort_order: 0,
  is_active: true,
};

export default function MapSpotsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tt, setTt] = useState<{ id: string; name_it: string }[]>([]);
  const [places, setPlaces] = useState<{ id: string; name_it: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: spots }, { data: types }, { data: pl }] = await Promise.all([
      supabase.from("map_spots").select("*").order("sort_order"),
      supabase.from("tour_types").select("id, name_it").eq("is_active", true),
      supabase.from("places").select("id, name_it").eq("is_active", true).order("name_it"),
    ]);
    setRows((spots as Row[]) ?? []);
    setTt(types ?? []);
    setPlaces(pl ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => {
    setEdit({ ...DEF, sort_order: rows.length });
    setErrors({});
    setOpen(true);
  };

  const onSubmit = async () => {
    if (!edit) return;
    const errs: Record<string, string> = {};
    if (!edit.name_it || String(edit.name_it).trim().length < 2) errs.name_it = "Nome IT obbligatorio";
    if (!edit.name_en || String(edit.name_en).trim().length < 2) errs.name_en = "Nome EN obbligatorio";
    if (edit.lat == null || edit.lng == null) errs.lat = "Clicca sulla mappa per posizionare la meta";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const payload = {
        id: edit.id || crypto.randomUUID(),
        slug: edit.slug || String(edit.name_it).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name_it: String(edit.name_it).trim(),
        name_en: String(edit.name_en).trim(),
        short_description_it: edit.short_description_it || null,
        short_description_en: edit.short_description_en || null,
        long_description_it: edit.long_description_it || null,
        long_description_en: edit.long_description_en || null,
        lat: Number(edit.lat),
        lng: Number(edit.lng),
        cover_image_url: edit.cover_image_url || null,
        tour_type_id: edit.tour_type_id || null,
        place_id: edit.place_id || null,
        sort_order: Number(edit.sort_order ?? 0),
        is_active: edit.is_active !== false,
      };
      const { error } = await supabase.from("map_spots").upsert(payload as never, { onConflict: "id" });
      if (error) throw error;
      notify("success", "Meta proposta salvata");
      setOpen(false);
      void load();
    } catch (e) {
      notify("error", formatDbError((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r: Row) => {
    if (!confirm(`Eliminare "${r.name_it}"? Non comparirà più in mappa.`)) return;
    const { error } = await supabase.from("map_spots").delete().eq("id", r.id as string);
    if (error) notify("error", error.message);
    else { notify("success", "Meta eliminata"); void load(); }
  };

  return (
    <PageHeader
      title="Mappa / Mete proposte"
      subtitle="Punti visibili solo nella mappa, non nella sezione Tour della homepage"
      icon={<MapPinned className="w-5 h-5" />}
    >
      <MapSectionToggle />
      <AdminTutorial
        title="Mete proposte"
        description="Le mete proposte sono idee di visita che Davide vuole mostrare sulla mappa senza pubblicarle come tour nella homepage."
        badge="Guida Mappa"
        steps={[
          { title: "1. Posiziona", description: "Clicca sulla mappa o cerca per nome. Latitudine e longitudine sono obbligatorie.", badge: "Coordinate" },
          { title: "2. Testi", description: "Nome e descrizione breve in italiano; la traduzione inglese può essere automatica.", badge: "IT/EN" },
          { title: "3. Collegamenti", description: "Puoi associare un tipo di tour e, se vuoi, un luogo già presente nel sito.", badge: "Opzionale" },
        ]}
        tips={["Disattiva una meta per nasconderla dalla mappa pubblica senza cancellarla."]}
        defaultOpen={false}
      />
      <div className="bg-white border border-[#E9DCC4] rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9DCC4] flex items-center justify-between">
          <p className="text-sm text-[#7A6655]">{rows.length} mete proposte</p>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-medium hover:bg-[#9C1C1C]">
            <Plus className="w-4 h-4" /> Nuova meta
          </button>
        </div>
        {loading ? null : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#92816A]">Nessuna meta proposta. Creane una per farla comparire in /mappa.</div>
        ) : (
          <div className="divide-y divide-[#F0E8D6]">
            {rows.map((r) => (
              <div key={r.id as string} className="px-5 py-3.5 flex items-center gap-3">
                {r.cover_image_url ? (
                  <div className="relative w-12 h-12 rounded-sm overflow-hidden shrink-0 bg-[#F0E8D6]">
                    <Image src={String(r.cover_image_url)} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-[#F0E8D6] flex items-center justify-center text-[#92816A] shrink-0">
                    <MapPinned className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1E160A] truncate">{r.name_it}</p>
                  <p className="text-xs text-[#7A6655]">
                    {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}
                    {!r.is_active && <span className="ml-2 text-[#9C1C1C]">nascosta</span>}
                  </p>
                </div>
                <button onClick={() => { setEdit({ ...r }); setErrors({}); setOpen(true); }} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center text-[#5C4C38]">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => void onDelete(r)} className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 flex items-center justify-center text-[#9C1C1C]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && edit && createPortal(
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E160A]/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9DCC4]">
              <h2 className="text-xl font-semibold font-serif">{edit.id ? "Modifica meta proposta" : "Nuova meta proposta"}</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {Object.keys(errors).length > 0 && (
                <div className="flex gap-2 p-3 bg-[#B22A2A]/10 border border-[#B22A2A]/30 rounded-sm text-sm text-[#9C1C1C]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {Object.values(errors).join(" · ")}
                </div>
              )}
              <Grid2>
                <Field label={<>Nome IT <span className="text-[#B22A2A]">*</span></>}>
                  <input className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.name_it || ""} onChange={(e) => setEdit({ ...edit, name_it: e.target.value })} />
                </Field>
                <Field label={<>Nome EN <span className="text-[#B22A2A]">*</span></>} hint={<TranslateButton sourceText={String(edit.name_it || "")} onTranslated={(t) => setEdit((p) => p ? { ...p, name_en: t } : p)} />}>
                  <input className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.name_en || ""} onChange={(e) => setEdit({ ...edit, name_en: e.target.value })} />
                </Field>
              </Grid2>
              <Field label="Descrizione breve IT">
                <textarea rows={2} className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.short_description_it || ""} onChange={(e) => setEdit({ ...edit, short_description_it: e.target.value })} />
              </Field>
              <Field label="Descrizione breve EN" hint={
                <button type="button" className="text-[10px] font-bold uppercase text-[#3D6E90]" onClick={async () => {
                  if (!edit.short_description_it) return;
                  const t = await translateLongText(String(edit.short_description_it), "it", "en");
                  setEdit((p) => p ? { ...p, short_description_en: t } : p);
                }}>Traduci</button>
              }>
                <textarea rows={2} className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.short_description_en || ""} onChange={(e) => setEdit({ ...edit, short_description_en: e.target.value })} />
              </Field>
              <CoordPicker
                lat={edit.lat ?? null}
                lng={edit.lng ?? null}
                onChange={(lat, lng) => setEdit({ ...edit, lat, lng })}
              />
              <Grid2>
                <Field label="Tipo di tour">
                  <select className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.tour_type_id || ""} onChange={(e) => setEdit({ ...edit, tour_type_id: e.target.value || null })}>
                    <option value="">— Nessuno —</option>
                    {tt.map((t) => <option key={t.id} value={t.id}>{t.name_it}</option>)}
                  </select>
                </Field>
                <Field label="Luogo collegato (opzionale)">
                  <select className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.place_id || ""} onChange={(e) => setEdit({ ...edit, place_id: e.target.value || null })}>
                    <option value="">— Nessuno —</option>
                    {places.map((p) => <option key={p.id} value={p.id}>{p.name_it}</option>)}
                  </select>
                </Field>
              </Grid2>
              <Field label="Immagine di copertina">
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.cover_image_url || ""} onChange={(e) => setEdit({ ...edit, cover_image_url: e.target.value })} />
                  <button type="button" onClick={() => setMediaOpen(true)} className="px-3 py-2 border border-[#E9DCC4] rounded-sm text-sm inline-flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Scegli
                  </button>
                </div>
              </Field>
              <Grid2>
                <Field label="Ordine">
                  <input type="number" className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} />
                </Field>
                <Field label="Visibile in mappa">
                  <select className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm" value={edit.is_active === false ? "0" : "1"} onChange={(e) => setEdit({ ...edit, is_active: e.target.value === "1" })}>
                    <option value="1">Sì</option>
                    <option value="0">No</option>
                  </select>
                </Field>
              </Grid2>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E9DCC4] bg-[#F9F4EC]">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm">Annulla</button>
              <button type="button" onClick={() => void onSubmit()} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-[#9C1C1C] text-white rounded-sm text-sm disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salva
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mediaOpen && (
        <MediaPickerModal
          value={String(edit?.cover_image_url || "")}
          onChange={(url) => { setEdit((p) => p ? { ...p, cover_image_url: url } : p); setMediaOpen(false); }}
          onClose={() => setMediaOpen(false)}
          title="Immagine meta proposta"
        />
      )}
    </PageHeader>
  );
}
