"use client";

import React, { useState, useEffect } from "react";
import TranslateButton from "@/components/admin/TranslateButton";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle,
  Languages,
  SlidersHorizontal,
} from "lucide-react";
import { cn, formatDbError } from "@/lib/utils";
import supabase from "@/lib/supabase/browser";
import { renderIconByName } from "@/lib/icons";
import IconPicker from "@/components/live-edit/IconPicker";
import AdminTutorial from "@/components/admin/AdminTutorial";
import Link from "next/link";
import { translateLongText } from "@/lib/translateClient";

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

export interface BannerItem {
  id: string;
  text_it: string;
  text_en: string;
  icon: string;
  style: "olive" | "neutral" | "terracotta" | "dark";
}

const STYLE_OPTIONS: {
  value: BannerItem["style"];
  label: string;
  badgeClass: string;
  iconClass: string;
}[] = [
  {
    value: "olive",
    label: "Verde Oliva / Slow Tourism",
    badgeClass: "bg-olive/10 border border-olive/30 text-olive-dark",
    iconClass: "text-terracotta",
  },
  {
    value: "neutral",
    label: "Neutro / Pergamena Chiaro",
    badgeClass: "bg-bg-alt/90 border border-black/10 text-text-main",
    iconClass: "text-olive-dark",
  },
  {
    value: "terracotta",
    label: "Terracotta Elegante",
    badgeClass: "bg-terracotta/10 border border-terracotta/30 text-terracotta-dark",
    iconClass: "text-terracotta",
  },
  {
    value: "dark",
    label: "Scuro / Notturno",
    badgeClass: "bg-bg-dark text-text-white border border-text-white/15",
    iconClass: "text-terracotta",
  },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Edit / Create State
  const [editItem, setEditItem] = useState<BannerItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Riferimento all'ultimo testo IT tradotto/visto
  const lastSeenBannerTextIt = React.useRef("");
  const [translatingText, setTranslatingText] = useState<"idle" | "loading" | "success" | "error">("idle");

  // AUTO-TRANSLATE: TESTO BANNER (IT -> EN)
  useEffect(() => {
    const valIT = editItem?.text_it;
    if (!editItem || !valIT || valIT.trim().length < 2 || valIT === lastSeenBannerTextIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingText("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenBannerTextIt.current = valIT;
        setEditItem((prev) => (prev ? { ...prev, text_en: translated } : prev));
        setTranslatingText("success");
        setTimeout(() => setTranslatingText("idle"), 2000);
      } catch {
        setTranslatingText("error");
        setTimeout(() => setTranslatingText("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [editItem?.text_it]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("ui_strings") as any)
        .select("key, it, en")
        .like("key", "banner.%");

      if (error) throw error;

      const map: Record<string, { it: string; en: string }> = {};
      (data || []).forEach((row: any) => {
        map[row.key] = { it: row.it || "", en: row.en || "" };
      });

      const listStr = map["banner.list"]?.it || "1,2";
      const ids = listStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const loaded: BannerItem[] = ids.map((id) => ({
        id,
        text_it:
          map[`banner.${id}.text`]?.it ||
          (id === "1"
            ? "Slow tourism · tempo per guardare"
            : id === "2"
            ? "Professore di Lettere & Storia · Specialista in Storia dell'Arte"
            : ""),
        text_en:
          map[`banner.${id}.text`]?.en ||
          (id === "1"
            ? "Slow tourism · time to gaze"
            : id === "2"
            ? "Professor of Literature & History · Art History Specialist"
            : ""),
        icon:
          map[`banner.${id}.icon`]?.it ||
          (id === "1" ? "Hourglass" : id === "2" ? "GraduationCap" : "Sparkles"),
        style:
          (map[`banner.${id}.style`]?.it as BannerItem["style"]) ||
          (id === "1" ? "olive" : "neutral"),
      }));

      // Se non ce n'erano, metti i 2 predefiniti
      if (loaded.length === 0) {
        setBanners([
          {
            id: "1",
            text_it: "Slow tourism · tempo per guardare",
            text_en: "Slow tourism · time to gaze",
            icon: "Hourglass",
            style: "olive",
          },
          {
            id: "2",
            text_it: "Professore di Lettere & Storia · Specialista in Storia dell'Arte",
            text_en: "Professor of Literature & History · Art History Specialist",
            icon: "GraduationCap",
            style: "neutral",
          },
        ]);
      } else {
        setBanners(loaded);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: formatDbError(err?.message || "Errore caricamento") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const saveAllBanners = async (newBanners: BannerItem[]) => {
    setSaving(true);
    setMsg(null);
    try {
      const now = new Date().toISOString();
      const listStr = newBanners.map((b) => b.id).join(",");

      const upserts: any[] = [
        {
          key: "banner.list",
          it: listStr,
          en: listStr,
          description: "Elenco ID dei banner hero attivi",
          updated_at: now,
        },
      ];

      for (const b of newBanners) {
        upserts.push({
          key: `banner.${b.id}.text`,
          it: b.text_it,
          en: b.text_en || b.text_it,
          description: `Testo banner ${b.id}`,
          updated_at: now,
        });
        upserts.push({
          key: `banner.${b.id}.icon`,
          it: b.icon,
          en: b.icon,
          description: `Icona banner ${b.id}`,
          updated_at: now,
        });
        upserts.push({
          key: `banner.${b.id}.style`,
          it: b.style,
          en: b.style,
          description: `Stile banner ${b.id}`,
          updated_at: now,
        });
      }

      const { error } = await (supabase.from("ui_strings") as any).upsert(upserts, {
        onConflict: "key",
      });

      if (error) throw error;

      setBanners(newBanners);
      setMsg({ type: "ok", text: "✓ Banner salvati con successo e visibili sul sito!" });
      setEditItem(null);
    } catch (err: any) {
      setMsg({ type: "err", text: formatDbError(err?.message || "Errore salvataggio") });
    } finally {
      setSaving(false);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    saveAllBanners(copy);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo banner?")) return;
    const filtered = banners.filter((b) => b.id !== id);
    saveAllBanners(filtered);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    let updated: BannerItem[];
    if (isNew) {
      const newId = `b_${Date.now()}`;
      updated = [...banners, { ...editItem, id: newId }];
    } else {
      updated = banners.map((b) => (b.id === editItem.id ? editItem : b));
    }

    saveAllBanners(updated);
  };

  const openNew = () => {
    setIsNew(true);
    lastSeenBannerTextIt.current = "";
    setEditItem({
      id: "",
      text_it: "",
      text_en: "",
      icon: "Sparkles",
      style: "neutral",
    });
    setPickerOpen(false);
  };

  const openEdit = (b: BannerItem) => {
    setIsNew(false);
    lastSeenBannerTextIt.current = b?.text_it || "";
    setEditItem({ ...b });
    setPickerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#9C1C1C]">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Gestione Grafica</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#1E160A] mt-1">
            Banner in Cima al Sito (Hero)
          </h1>
          <p className="text-sm text-[#7A6655] mt-1">
            Crea, modifica, riordina o elimina i badge in evidenza mostrati all&apos;inizio della Hero Section.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/live-editor"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm border border-[#C4B49A] text-[#3D2E1A] hover:bg-[#F0E8D6] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Vedi in Live Editor
          </Link>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-semibold hover:bg-[#9C1C1C] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuovo Banner
          </button>
        </div>
      </div>

      {/* Tutorial */}
      <AdminTutorial
        title="Come funzionano i Banner in Cima"
        description="I banner sono i badge grafici posti subito sopra il titolo principale della Hero. Possono evidenziare qualifiche accademiche, motti, specializzazioni o certificazioni."
        badge="Guida Banner"
        steps={[
          {
            title: "1. Scegli Icona & Stile",
            description: "Ogni banner ha una sua icona dedicata e uno stile cromatico (Verde Oliva, Terracotta, Neutro pergamena, Scuro notturno).",
            badge: "Grafica",
          },
          {
            title: "2. Testo Bilingue (IT & EN)",
            description: "Inserisci il testo sia in italiano che in inglese per i visitatori stranieri.",
            badge: "Bilingue",
          },
          {
            title: "3. Riordina liberamente",
            description: "Usa le frecce su/giù per cambiare la posizione orizzontale dei banner in cima al sito.",
            badge: "Ordinamento",
          },
        ]}
        defaultOpen={false}
      />

      {msg && (
        <div
          className={cn(
            "p-3.5 rounded-sm text-sm font-medium border flex items-center gap-2",
            msg.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}
        >
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="p-5 bg-gradient-to-r from-[#F9F4EC] to-[#F0E8D6] rounded-md shadow-sm border border-stone/50">
        <div className="flex items-center justify-between mb-3 border-b border-black/8 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C1C1C] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9C1C1C]" />
            Anteprima Visiva in Tempo Reale nel Sito
          </span>
          <span className="text-[10px] text-[#7A6655] font-medium">Posizione: Hero Section (In Cima)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 py-2 w-full overflow-hidden">
          {banners.length === 0 ? (
            <span className="text-xs text-[#7A6655] italic">Nessun banner attivo</span>
          ) : (
            banners.map((b) => {
              const opt = STYLE_OPTIONS.find((s) => s.value === b.style) || STYLE_OPTIONS[1];
              return (
                <div
                  key={b.id}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-semibold whitespace-nowrap shadow-sm backdrop-blur-sm max-w-full min-w-0",
                    opt.badgeClass
                  )}
                >
                  {renderIconByName(b.icon, {
                    className: cn("w-4 h-4 shrink-0", opt.iconClass),
                  })}
                  <span className="truncate">{b.text_it || "Testo banner..."}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Form Modale / In-line */}
      {editItem && (
        <form
          onSubmit={handleSaveForm}
          className="p-5 bg-white border-2 border-[#B22A2A] rounded-md shadow-lg space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E9DCC4] pb-3">
            <h2 className="font-serif text-lg font-bold text-[#1E160A] flex items-center gap-2">
              {isNew ? <Plus className="w-5 h-5 text-[#B22A2A]" /> : <Edit2 className="w-5 h-5 text-[#B22A2A]" />}
              {isNew ? "Aggiungi Nuovo Banner" : "Modifica Banner"}
            </h2>
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="text-xs font-semibold text-[#7A6655] hover:text-[#2E2010]"
            >
              Annulla
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Testo IT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3D2E1A] flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1 py-0.5 bg-[#E9DCC4] text-[#5C4C38] rounded">IT</span> Testo Italiano *
              </label>
              <input
                required
                className="inpt text-sm w-full font-medium"
                value={editItem.text_it}
                onChange={(e) => setEditItem({ ...editItem, text_it: e.target.value })}
                placeholder="es. Slow tourism · tempo per guardare"
              />
            </div>

            {/* Testo EN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3D2E1A] flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-1 py-0.5 bg-[#3D6E90]/10 text-[#3D6E90] rounded">EN</span> English Translation
                </label>
                <div className="flex items-center gap-1.5">
                  <AutoTranslateBadge state={translatingText} />
                  <TranslateButton
                    sourceText={editItem.text_it || ""}
                    onTranslated={(t) => {
                      lastSeenBannerTextIt.current = editItem.text_it || "";
                      setEditItem((prev) => (prev ? { ...prev, text_en: t } : prev));
                    }}
                  />
                </div>
              </div>
              <input
                className="inpt text-sm w-full font-medium"
                value={editItem.text_en}
                onChange={(e) => {
                  setEditItem({ ...editItem, text_en: e.target.value });
                }}
                placeholder="e.g. Slow tourism · time to gaze"
              />
            </div>
          </div>

          {/* Selezione Icona & Stile */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3D2E1A] block">
                Icona del Banner
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-sm border border-[#C4B49A] bg-[#F9F4EC] flex items-center justify-center text-[#B22A2A] shadow-inner">
                  {renderIconByName(editItem.icon, { className: "w-6 h-6" })}
                </div>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((v) => !v)}
                    className="w-full py-2.5 px-3 border border-[#C4B49A] rounded-sm text-xs font-semibold text-[#3D2E1A] hover:bg-[#F9F4EC] flex items-center justify-between"
                  >
                    <span>Icona: <strong>{editItem.icon}</strong></span>
                    <span className="text-[#B22A2A]">Scegli icona ▾</span>
                  </button>
                  {pickerOpen && (
                    <div className="absolute left-0 top-full mt-1 z-50">
                      <IconPicker
                        value={editItem.icon}
                        onChange={(iconName) => {
                          setEditItem({ ...editItem, icon: iconName });
                          setPickerOpen(false);
                        }}
                        onClose={() => setPickerOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stile Cromatico */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3D2E1A] block">
                Stile Grafico & Colori
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setEditItem({ ...editItem, style: s.value })}
                    className={cn(
                      "p-2.5 rounded-sm border text-left text-xs font-semibold transition-all flex flex-col gap-1",
                      editItem.style === s.value
                        ? "border-[#B22A2A] ring-2 ring-[#B22A2A]/30 bg-white"
                        : "border-[#E9DCC4] hover:bg-[#F9F4EC] bg-white opacity-80"
                    )}
                  >
                    <span className="text-[11px] truncate text-[#1E160A]">{s.label}</span>
                    <span className={cn("px-2 py-0.5 rounded-xs text-[10px] w-fit", s.badgeClass)}>
                      Esempio
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E9DCC4]">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="px-4 py-2 rounded-sm text-xs font-semibold text-[#5C4C38] hover:bg-[#F0E8D6]"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#B22A2A] text-white rounded-sm text-xs font-bold hover:bg-[#9C1C1C] disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva Banner
            </button>
          </div>
        </form>
      )}

      {/* Lista Banner */}
      <div className="bg-white border border-[#E9DCC4] rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E9DCC4] bg-[#F9F4EC] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">
            Elenco Banner Attivi ({banners.length})
          </span>
          <span className="text-xs text-[#92816A]">Trascina o usa le frecce per ordinare</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#92816A]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B22A2A]" />
            Caricamento banner…
          </div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-[#92816A] text-xs">
            Nessun banner configurato. Clicca su &quot;Nuovo Banner&quot; per iniziare.
          </div>
        ) : (
          <div className="divide-y divide-[#F0E8D6]">
            {banners.map((b, index) => {
              const opt = STYLE_OPTIONS.find((s) => s.value === b.style) || STYLE_OPTIONS[1];
              return (
                <div
                  key={b.id}
                  className="p-3 xs:p-4 flex items-center justify-between gap-2 xs:gap-4 hover:bg-[#F9F4EC] transition-colors w-full min-w-0"
                >
                  <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1 w-0">
                    <span className="font-mono text-xs text-[#92816A] w-5 text-center font-bold shrink-0">
                      #{index + 1}
                    </span>

                    {/* Preview Badge */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-semibold min-w-0 flex-1 shadow-xs",
                        opt.badgeClass
                      )}
                    >
                      {renderIconByName(b.icon, {
                        className: cn("w-3.5 h-3.5 shrink-0", opt.iconClass),
                      })}
                      <span className="truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[340px]">{b.text_it}</span>
                    </div>

                    <div className="hidden sm:block text-xs text-[#92816A] truncate min-w-0 flex-1">
                      {b.text_en && <span><span className="text-[8px] font-bold px-0.5 bg-[#3D6E90]/10 text-[#3D6E90] rounded shrink-0">EN</span> <span className="truncate">{b.text_en}</span></span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 xs:gap-1.5 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="w-8 h-8 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
                      title="Sposta a sinistra / in alto"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="w-8 h-8 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
                      title="Sposta a destra / in basso"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="w-8 h-8 rounded-sm hover:bg-[#E9DCC4] text-[#3D2E1A] flex items-center justify-center transition-colors"
                      title="Modifica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="w-8 h-8 rounded-sm hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}