"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  X,
  Film,
  AlertCircle,
} from "lucide-react";
import supabase from "@/lib/supabase/browser";
import { cn, formatDbError } from "@/lib/utils";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import AdminTutorial from "@/components/admin/AdminTutorial";
import TranslateButton from "@/components/admin/TranslateButton";
import { translateLongText } from "@/lib/translateClient";

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

type GalleryItem = {
  id: string;
  url: string;
  type: "image" | "video";
  caption_it: string;
  caption_en: string;
  description_it: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
};

const emptyDraft = (): Omit<GalleryItem, "id"> => ({
  url: "",
  type: "image",
  caption_it: "",
  caption_en: "",
  description_it: "",
  description_en: "",
  sort_order: 0,
  is_active: true,
});

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<(GalleryItem & { isNew?: boolean }) | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  const lastSeenCaptionIt = useRef("");
  const lastSeenDescIt = useRef("");
  const [translatingCaption, setTranslatingCaption] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [translatingDesc, setTranslatingDesc] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (draft) {
      lastSeenCaptionIt.current = draft.caption_it || "";
      lastSeenDescIt.current = draft.description_it || "";
    }
  }, [draft?.id, draft?.isNew]);

  useEffect(() => {
    const valIT = draft?.caption_it;
    if (!draft || !valIT || valIT.trim().length < 2 || valIT === lastSeenCaptionIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingCaption("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenCaptionIt.current = valIT;
        setDraft((current) => (current ? { ...current, caption_en: translated } : current));
        setTranslatingCaption("success");
        setTimeout(() => setTranslatingCaption("idle"), 2000);
      } catch {
        setTranslatingCaption("error");
        setTimeout(() => setTranslatingCaption("idle"), 3000);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [draft?.caption_it]);

  useEffect(() => {
    const valIT = draft?.description_it;
    if (!draft || !valIT || valIT.trim().length < 5 || valIT === lastSeenDescIt.current) return;

    const timer = setTimeout(async () => {
      setTranslatingDesc("loading");
      try {
        const translated = await translateLongText(valIT.trim(), "it", "en");
        lastSeenDescIt.current = valIT;
        setDraft((current) => (current ? { ...current, description_en: translated } : current));
        setTranslatingDesc("success");
        setTimeout(() => setTranslatingDesc("idle"), 2000);
      } catch {
        setTranslatingDesc("error");
        setTimeout(() => setTranslatingDesc("idle"), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [draft?.description_it]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("media_items") as any)
      .select("id, url, type, caption_it, caption_en, description_it, description_en, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) setMsg({ type: "err", text: formatDbError(error.message) });
    else setItems((data || []).map((item: any) => ({
      ...item,
      caption_it: item.caption_it || "",
      caption_en: item.caption_en || "",
      description_it: item.description_it || "",
      description_en: item.description_en || ""
    })));
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const saveDraft = async () => {
    if (!draft?.url.trim()) {
      setMsg({ type: "err", text: draft?.type === "video" ? "Inserisci l'URL del video." : "Scegli o carica prima un'immagine." });
      return;
    }
    setSaving(true);
    setMsg(null);

    const payload = {
      url: draft.url.trim(),
      type: draft.type,
      caption_it: draft.caption_it.trim() || null,
      caption_en: draft.caption_en.trim() || null,
      description_it: draft.description_it.trim() || null,
      description_en: draft.description_en.trim() || null,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    };

    const result = draft.isNew
      ? await (supabase.from("media_items") as any).insert(payload)
      : await (supabase.from("media_items") as any).update(payload).eq("id", draft.id);

    if (result.error) setMsg({ type: "err", text: formatDbError(result.error.message) });
    else {
      setMsg({
        type: "ok",
        text: draft.isNew
          ? (draft.type === "video" ? "Video aggiunto alla galleria." : "Immagine aggiunta alla galleria.")
          : "Elemento galleria aggiornato."
      });
      setDraft(null);
      await loadItems();
    }
    setSaving(false);
  };

  const removeItem = async (item: GalleryItem) => {
    if (!window.confirm(`Rimuovere definitivamente ${item.caption_it || `questo ${item.type === "video" ? "video" : "immagine"}`} dalla galleria?`)) return;
    const { error } = await (supabase.from("media_items") as any).delete().eq("id", item.id);
    if (error) setMsg({ type: "err", text: formatDbError(error.message) });
    else {
      setMsg({ type: "ok", text: "Elemento rimosso dalla galleria." });
      await loadItems();
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    const updates = next.map((item, sort_order) =>
      (supabase.from("media_items") as any).update({ sort_order }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setMsg({ type: "err", text: formatDbError(error.message) });
      await loadItems();
    }
  };

  const toggleActive = async (item: GalleryItem) => {
    const { error } = await (supabase.from("media_items") as any)
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) setMsg({ type: "err", text: formatDbError(error.message) });
    else await loadItems();
  };

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <AdminTutorial
        title="Gestione Galleria Media"
        description="Carica immagini o aggiungi video (YouTube, Vimeo, MP4), modifica titoli e descrizioni in italiano e inglese, scegli cosa mostrare e definisci l'ordine."
        badge="Galleria multimediale"
        defaultOpen={false}
        steps={[
          { title: "Scegli il tipo", description: "Decidi se aggiungere un'immagine o un video.", badge: "1" },
          { title: "Carica o inserisci URL", description: "Per le immagini carica un file o incolla l'URL. Per i video inserisci l'URL di YouTube/Vimeo/MP4.", badge: "2" },
          { title: "Descrivi", description: "Aggiungi un titolo breve e una descrizione estesa IT/EN.", badge: "3" },
          { title: "Ordina", description: "Usa le frecce per scegliere la sequenza degli elementi.", badge: "4" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E9DCC4] pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[.16em] font-bold text-[#9C1C1C]">Contenuti media</p>
          <h1 className="font-serif text-3xl font-bold text-[#1E160A] mt-1">Galleria immagini e video</h1>
          <p className="text-sm text-[#7A6655] mt-1">
            {items.length} elementi totali · {items.filter((item) => item.is_active).length} visibili sul sito
            {items.filter(i => i.type === "video").length > 0 && ` · ${items.filter(i => i.type === "video").length} video`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ id: "", ...emptyDraft(), sort_order: items.length, isNew: true })}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#9C1C1C] hover:bg-[#6E1212] text-white text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Aggiungi elemento
        </button>
      </div>

      {msg && (
        <div className={cn(
          "p-3 rounded-sm text-sm flex items-center gap-2 border",
          msg.type === "ok" ? "bg-[#4A6535]/10 text-[#3A5228] border-[#4A6535]/25" : "bg-[#9C1C1C]/10 text-[#9C1C1C] border-[#9C1C1C]/25"
        )}>
          <CheckCircle2 className="w-4 h-4" />
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-7 h-7 text-[#9C1C1C] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-[#E9DCC4] rounded-xl text-center bg-white">
          <ImageIcon className="w-10 h-10 mx-auto text-[#C4B49A] mb-3" />
          <p className="font-semibold text-[#3D2E1A]">La galleria è vuota</p>
          <p className="text-sm text-[#7A6655] mt-1">Aggiungi immagini o video per mostrarli nella sezione Media.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                "overflow-hidden rounded-xl bg-white border shadow-sm",
                item.is_active ? "border-[#E9DCC4]" : "border-[#E9DCC4] opacity-60"
              )}
            >
              <div className="relative aspect-[4/3] bg-[#F0E8D6]">
                <Image
                  src={
                    item.type === "video" && (item.url.includes("youtube") || item.url.includes("youtu.be"))
                      ? `https://img.youtube.com/vi/${item.url.match(/(?:youtube.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu.be\/)([a-zA-Z0-9_-]{11})/i)?.[1] || "default"}/hqdefault.jpg`
                      : item.url
                  }
                  alt={item.caption_it || "Immagine galleria"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-1 rounded-sm bg-black/65 text-white text-[10px] font-bold">
                  #{index + 1}
                </span>
                {item.type === "video" && (
                  <span className="absolute top-2 right-2 px-2 py-1 rounded-sm bg-[#9C1C1C]/90 text-white text-[10px] font-bold inline-flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Video
                  </span>
                )}
                {!item.is_active && (
                  <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-xs font-bold">
                    Nascosta dal sito
                  </span>
                )}
              </div>
              <div className="p-3.5 space-y-3">
                <div>
                  <p className="font-semibold text-sm text-[#1E160A] truncate">
                    {item.caption_it || "Senza titolo"}
                  </p>
                  <p className="text-xs text-[#7A6655] line-clamp-2">
                    {item.description_it || "Nessuna descrizione"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-1 border-t border-[#F0E8D6] pt-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="p-2 rounded-sm hover:bg-[#F0E8D6] disabled:opacity-25"
                      title="Sposta prima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="p-2 rounded-sm hover:bg-[#F0E8D6] disabled:opacity-25"
                      title="Sposta dopo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className="p-2 rounded-sm hover:bg-[#F0E8D6] text-[#5C4C38]"
                      title={item.is_active ? "Nascondi dal sito" : "Mostra sul sito"}
                    >
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...item })}
                      className="p-2 rounded-sm hover:bg-[#F0E8D6] text-[#3D6E90]"
                      title="Modifica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="p-2 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C]"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#E9DCC4] p-5 sm:p-6 space-y-5 my-auto">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#9C1C1C]">Galleria</p>
                <h2 className="font-serif text-2xl font-bold">
                  {draft.isNew
                    ? (draft.type === "video" ? "Aggiungi video" : "Aggiungi immagine")
                    : `Modifica ${draft.type === "video" ? "video" : "immagine"}`
                  }
                </h2>
              </div>
              <button type="button" onClick={() => setDraft(null)} className="p-2 hover:bg-[#F0E8D6] rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: "image", url: "" })}
                className={cn(
                  "flex-1 px-4 py-3 rounded-sm border text-sm font-semibold transition-all",
                  draft.type === "image"
                    ? "bg-[#9C1C1C] text-white border-[#9C1C1C]"
                    : "bg-white text-[#3D2E1A] border-[#E9DCC4] hover:border-[#9C1C1C]/40"
                )}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Immagine
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: "video", url: "" })}
                className={cn(
                  "flex-1 px-4 py-3 rounded-sm border text-sm font-semibold transition-all",
                  draft.type === "video"
                    ? "bg-[#9C1C1C] text-white border-[#9C1C1C]"
                    : "bg-white text-[#3D2E1A] border-[#E9DCC4] hover:border-[#9C1C1C]/40"
                )}
              >
                <Film className="w-4 h-4 inline mr-2" />
                Video
              </button>
            </div>

            {draft.type === "image" ? (
              <MediaPickerModal
                value={draft.url}
                onChange={(url) => setDraft((current) => (current ? { ...current, url } : current))}
                title="Immagine della galleria"
              />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3D2E1A]">
                  URL Video (YouTube, Vimeo o MP4)
                  <input
                    type="url"
                    value={draft.url}
                    onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    className="mt-1.5 w-full p-2.5 rounded-sm border border-[#E9DCC4] font-normal text-sm"
                    placeholder="https://www.youtube.com/watch?v=... oppure https://vimeo.com/... o URL diretto .mp4"
                  />
                </label>
                {draft.url && (
                  <div className="text-xs text-[#7A6655] bg-[#F9F4EC] p-3 rounded-sm border border-[#E9DCC4]">
                    {draft.url.includes("youtube") || draft.url.includes("youtu.be")
                      ? "✓ Rilevato: YouTube"
                      : draft.url.includes("vimeo")
                        ? "✓ Rilevato: Vimeo"
                        : draft.url.endsWith(".mp4")
                          ? "✓ Rilevato: File MP4 diretto"
                          : "⚠️ Formato URL non riconosciuto. Assicurati che sia un link YouTube, Vimeo o un file .mp4"}
                  </div>
                )}
              </div>
            )}

            {/* TITOLO BREVE */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#3D2E1A] mb-1">
                  Titolo breve (IT)
                </label>
                <textarea
                  rows={2}
                  value={draft.caption_it}
                  onChange={(e) => setDraft({ ...draft, caption_it: e.target.value })}
                  className="w-full p-2.5 rounded-sm border border-[#E9DCC4] font-normal text-sm resize-y focus:border-[#9C1C1C] focus:outline-none"
                  placeholder="Es. La ciclabile del Brenta"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-[#3D2E1A]">
                    Titolo breve (EN)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <AutoTranslateBadge state={translatingCaption} />
                    <TranslateButton
                      sourceText={draft.caption_it}
                      onTranslated={(t) => {
                        lastSeenCaptionIt.current = draft.caption_it || "";
                        setDraft((curr) => (curr ? { ...curr, caption_en: t } : curr));
                      }}
                      size="sm"
                    />
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={draft.caption_en}
                  onChange={(e) => setDraft({ ...draft, caption_en: e.target.value })}
                  className="w-full p-2.5 rounded-sm border border-[#E9DCC4] font-normal text-sm resize-y focus:border-[#3D6E90] focus:outline-none"
                  placeholder="E.g. The Brenta cycle path"
                />
              </div>
            </div>

            {/* DESCRIZIONE ESTESA */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#3D2E1A] mb-1">
                  Descrizione estesa (IT)
                </label>
                <textarea
                  rows={4}
                  value={draft.description_it}
                  onChange={(e) => setDraft({ ...draft, description_it: e.target.value })}
                  className="w-full p-2.5 rounded-sm border border-[#E9DCC4] font-normal text-sm resize-y focus:border-[#9C1C1C] focus:outline-none"
                  placeholder="Es. Un percorso panoramico che attraversa..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-[#3D2E1A]">
                    Descrizione estesa (EN)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <AutoTranslateBadge state={translatingDesc} />
                    <TranslateButton
                      sourceText={draft.description_it}
                      onTranslated={(t) => {
                        lastSeenDescIt.current = draft.description_it || "";
                        setDraft((curr) => (curr ? { ...curr, description_en: t } : curr));
                      }}
                      size="sm"
                    />
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={draft.description_en}
                  onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
                  className="w-full p-2.5 rounded-sm border border-[#E9DCC4] font-normal text-sm resize-y focus:border-[#3D6E90] focus:outline-none"
                  placeholder="E.g. A panoramic route crossing..."
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3D2E1A]">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="accent-[#9C1C1C]"
              />
              Mostra questo {draft.type === "video" ? "video" : "immagine"} sul sito
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E9DCC4]">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-4 py-2 text-sm font-semibold border border-[#E9DCC4] rounded-sm"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveDraft}
                className="px-4 py-2 bg-[#9C1C1C] text-white rounded-sm text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salva
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}