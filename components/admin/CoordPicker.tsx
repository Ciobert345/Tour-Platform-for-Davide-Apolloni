"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Field, Grid2 } from "@/components/admin/AdminUI";

const Inner = dynamic(() => import("./CoordPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-xs text-[#7A6655] bg-[#F9F4EC]">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carico la mappa…
    </div>
  ),
});

type SearchHit = { name: string; displayName: string; lat: number; lng: number };

export default function CoordPicker({
  lat,
  lng,
  onChange,
  height = 220,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  height?: number;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  const search = async () => {
    setErr("");
    setSearching(true);
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ricerca non disponibile");
      setHits(json.results ?? []);
      if ((json.results ?? []).length === 0) setErr("Nessun risultato nell'area");
    } catch (e) {
      setErr((e as Error).message);
      setHits([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9C1C1C]/30"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="Cerca per nome (es. Padova, Villa Pisani…)"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching || q.trim().length < 2}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#B22A2A] hover:bg-[#9C1C1C] text-white rounded-sm text-sm font-medium disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Cerca per nome
        </button>
      </div>
      {err && <p className="text-xs text-[#9C1C1C]">{err}</p>}
      {hits.length > 0 && (
        <ul className="border border-[#E9DCC4] rounded-sm divide-y divide-[#F0E8D6] max-h-36 overflow-y-auto bg-white">
          {hits.map((h, i) => (
            <li key={`${h.lat}-${h.lng}-${i}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-[#F9F4EC]"
                onClick={() => {
                  onChange(h.lat, h.lng);
                  setHits([]);
                  setQ(h.name);
                }}
              >
                <span className="font-semibold text-[#1E160A]">{h.name}</span>
                <span className="block text-[#7A6655] truncate">{h.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ height }} className="border border-[#E9DCC4] rounded-sm overflow-hidden">
        <Inner lat={lat} lng={lng} onPick={(a, b) => onChange(a, b)} />
      </div>
      <Grid2>
        <Field label="Latitudine">
          <input
            type="number"
            step="0.000001"
            className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white"
            value={lat ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              onChange(v, lng);
            }}
            placeholder="45.406435"
          />
        </Field>
        <Field label="Longitudine">
          <input
            type="number"
            step="0.000001"
            className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white"
            value={lng ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              onChange(lat, v);
            }}
            placeholder="11.876761"
          />
        </Field>
      </Grid2>
      <p className="text-[11px] text-[#7A6655]">Clicca sulla mappa per posizionare il punto. Lascia vuoto se il luogo non deve comparire in mappa.</p>
    </div>
  );
}
