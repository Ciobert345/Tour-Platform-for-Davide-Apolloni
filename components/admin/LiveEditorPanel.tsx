"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TranslateButton from "@/components/admin/TranslateButton";
import {
  MousePointerClick,
  Loader2,
  Save,
  RefreshCw,
  Languages,
  Image as ImageIcon,
  Type,
  ExternalLink,
  UserCog2,
  GraduationCap,
  Info,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Mail,
  Phone,
  Award,
  ChevronDown,
  Globe,
  SlidersHorizontal,
  FileText,
  Upload,
  Download,
  Layers,
  ArrowUp,
  ArrowDown,
  Video,
  Link2,
  X as XIcon,
  LayoutGrid,
  Shield,
  Palette,
  Eraser,
  Paintbrush,
} from "lucide-react";
import { cn, formatDbError } from "@/lib/utils";
import { saveLiveEdit } from "@/lib/live-edit/save";
import type { LiveEditMessage, LiveEditTarget, LiveEditValues } from "@/lib/live-edit/types";
import supabase from "@/lib/supabase/browser";
import AdminTutorial from "@/components/admin/AdminTutorial";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import IconPicker from "@/components/live-edit/IconPicker";
import { renderIconByName } from "@/lib/icons";
import { renderWithLinks, stripAllFormatting, stripSpanFormatting } from "@/lib/renderWithLinks";

const EMPTY: LiveEditValues = { it: "", en: "", url: "" };

import { translateText } from "@/lib/translateClient";

const autoTranslateTimers = new Map<string, NodeJS.Timeout>();

function triggerAutoTranslate(
  key: string,
  text: string,
  onTranslated: (translated: string) => void,
  delayMs = 1200
) {
  const existing = autoTranslateTimers.get(key);
  if (existing) clearTimeout(existing);

  if (!text || text.trim().length === 0) return;

  const timer = setTimeout(async () => {
    try {
      const translated = await translateText(text, "it", "en");
      if (translated && translated !== text) {
        onTranslated(translated);
      }
    } finally {
      autoTranslateTimers.delete(key);
    }
  }, delayMs);

  autoTranslateTimers.set(key, timer);
}

type ActiveTab = "visual" | "banners" | "profile" | "cv" | "faq" | "footer";

export default function LiveEditorPanel() {
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const initialTab = (searchParams?.get("tab") as ActiveTab) || "visual";
  const [tab, setTab] = useState<ActiveTab>(initialTab);

  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<LiveEditTarget | null>(null);
  const [values, setValues] = useState<LiveEditValues>(EMPTY);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [previewLang, setPreviewLang] = useState<"it" | "en">("it");

  const iframeSrc = `/?liveEdit=1&lang=${previewLang}`;

  const notifyIframe = useCallback((message: LiveEditMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const reloadPreview = () => {
    setReady(false);
    if (iframeRef.current) iframeRef.current.src = iframeSrc;
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as LiveEditMessage;
      if (data?.type === "LIVE_EDIT_READY") setReady(true);
      if (data?.type === "LIVE_EDIT_SELECT") {
        setTarget(data.target);
        setValues(data.values);
        setTab("visual");
        setMsg(null);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    reloadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLang]);

  useEffect(() => {
    const tParam = searchParams?.get("tab") as ActiveTab;
    if (tParam && ["visual", "banners", "profile", "cv", "faq", "footer"].includes(tParam)) {
      setTab(tParam);
    }
  }, [searchParams]);

  // Load profile ID
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("profiles") as any)
        .select("id")
        .limit(1)
        .maybeSingle();
      setProfileId(data?.id ?? null);
    })();
  }, []);

  const onSaveVisual = async () => {
    if (!target) return;
    setSaving(true);
    setMsg(null);
    try {
      // 1. Salva le modifiche nel database
      await saveLiveEdit(target, values, profileId);
      setMsg({ type: "ok", text: "✓ Testo salvato con successo" });

      // 2. Invia i nuovi valori all'iframe per aggiornare il testo in tempo reale
      notifyIframe({
        type: "LIVE_EDIT_UPDATED",
        targetId: target.id,
        values: values
      });

      // ✅ 3. NON chiamiamo reloadPreview() e NON chiudiamo il menu con setTimeout
      // L'utente vede il messaggio di successo e può continuare a modificare altri campi
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio") });
    } finally {
      setSaving(false);
    }
  };

  const KindIcon =
    target?.kind === "image" || target?.kind === "media_item"
      ? ImageIcon
      : target?.kind === "info_item"
        ? Info
        : target?.kind === "quote"
          ? Sparkles
          : target?.kind === "cv_item" || target?.kind === "credential"
            ? GraduationCap
            : target?.kind === "profile"
              ? UserCog2
              : target?.kind === "contact"
                ? Mail
                : Languages;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-[#F0E8D6]">
      {/* Tutorial at the very top */}
      <div className="p-4 md:px-6 md:pt-6 md:pb-0 bg-white border-b border-[#E9DCC4]">
        <AdminTutorial
          title="Come usare l'Editor Live per modificare l'intero sito"
          description="L'Editor Live è il centro unificato per gestire tutti i contenuti testuali, il tuo Profilo, il Curriculum, le FAQ e tutte le traduzioni IT/EN."
          badge="Guida Editor Live"
          steps={[
            {
              title: "1. Modifica Cliccando (Visuale)",
              description: "Clicca su qualsiasi testo o immagine nell'anteprima a destra per caricarlo e modificarlo istantaneamente.",
              badge: "Visuale",
            },
            {
              title: "2. Schede Dedicate Veloci",
              description: "Usa le schede in alto a sinistra (Profilo, CV, FAQ) per inserire o gestire elenchi e biografia.",
              badge: "Schede",
            },
            {
              title: "3. Anteprima Reattiva IT / EN",
              description: "Cambia lingua dell'anteprima in tempo reale con i pulsanti IT / EN per verificare come appare il sito ai visitatori.",
              badge: "Bilingue",
            },
          ]}
          tips={[
            "Tutti i salvataggi vengono memorizzati su Supabase e si riflettono istantaneamente nell'anteprima.",
            "Le sezioni dinamiche (Categorie Tour, Luoghi, Eventi, Recensioni, Prenotazioni) hanno i loro dati relazionali gestiti dalle rispettive pagine nella Dashboard; i loro titoli di sezione sono comunque modificabili qui!",
          ]}
          defaultOpen={false}
          className="mb-3"
        />
      </div>

      {/* Main split work area */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Left Side Panel */}
        <aside className="w-full md:w-[420px] lg:w-[460px] shrink-0 border-r border-[#E9DCC4] bg-white flex flex-col overflow-hidden shadow-sm">
          {/* Header & Tabs */}
          <div className="p-4 border-b border-[#E9DCC4] bg-[#F9F4EC]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-[#9C1C1C]">
                <MousePointerClick className="w-5 h-5" />
                <h1 className="font-serif text-lg font-semibold text-[#1E160A]">
                  Editor Live
                </h1>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#92816A]">
                  Anteprima:
                </span>
                <div className="flex rounded-sm border border-[#E9DCC4] overflow-hidden">
                  {(["it", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPreviewLang(l)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold uppercase transition-colors",
                        previewLang === l
                          ? "bg-[#B22A2A] text-white"
                          : "bg-white text-[#5C4C38] hover:bg-[#F0E8D6]"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={reloadPreview}
                  className="p-1.5 rounded-sm hover:bg-[#E9DCC4] text-[#7A6655] transition-colors"
                  title="Ricarica anteprima"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs - No Horizontal Scrollbar */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTab("visual");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    tab === "visual"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>Visuale (Clicca ed Edita)</span>
                  {target && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("banners");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    tab === "banners"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Banner (Hero)</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTab("profile");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-1.5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1",
                    tab === "profile"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <UserCog2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Profilo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("cv");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-1.5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1",
                    tab === "cv"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">CV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("faq");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-1.5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1",
                    tab === "faq"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">FAQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("footer");
                    setMsg(null);
                  }}
                  className={cn(
                    "px-1.5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1",
                    tab === "footer"
                      ? "bg-[#9C1C1C] text-white shadow-sm"
                      : "bg-white text-[#5C4C38] hover:bg-[#E9DCC4]/80 border border-[#E9DCC4]"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Footer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            {tab === "visual" && (
              <VisualTabContent
                target={target}
                values={values}
                setValues={setValues}
                setTarget={setTarget}
                ready={ready}
                saving={saving}
                msg={msg}
                setMsg={setMsg}
                onSave={onSaveVisual}
                previewLang={previewLang}
                setPreviewLang={setPreviewLang}
                KindIcon={KindIcon}
              />
            )}
            {tab === "banners" && (
              <BannersTabContent
                onSaved={() => {
                  notifyIframe({ type: "LIVE_EDIT_SAVED", targetId: "banner.list" });
                }}
              />
            )}
            {tab === "profile" && (
              <ProfileTabContent
                profileId={profileId}
                onSaved={() => {
                  notifyIframe({ type: "LIVE_EDIT_SAVED", targetId: "profile" });
                }}
              />
            )}
            {tab === "cv" && (
              <CvTabContent
                profileId={profileId}
                onSaved={() => {
                  notifyIframe({ type: "LIVE_EDIT_SAVED", targetId: "cv" });
                }}
              />
            )}
            {tab === "faq" && (
              <FaqTabContent
                onSaved={() => {
                  notifyIframe({ type: "LIVE_EDIT_SAVED", targetId: "faq" });
                }}
              />
            )}
            {tab === "footer" && (
              <FooterTabContent
                onSaved={() => {
                  notifyIframe({ type: "LIVE_EDIT_SAVED", targetId: "footer" });
                }}
              />
            )}
          </div>

        </aside>

        {/* Right Site Preview Iframe */}
        <div className="hidden md:flex flex-1 flex-col min-w-0 bg-[#E9DCC4] relative">
          {!ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F0E8D6]/90 gap-3">
              <Loader2 className="w-8 h-8 text-[#B22A2A] animate-spin" />
              <p className="text-sm font-medium text-[#5C4C38]">
                Caricamento anteprima reattiva…
              </p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="Anteprima sito pubblico"
            className="flex-1 w-full border-0 bg-white min-h-0"
            onLoad={() => setReady(true)}
          />
        </div>

        {/* Mobile bottom button */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#B22A2A] text-white rounded-sm text-sm font-semibold shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Apri anteprima modificabile
          </a>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 1: Visual Inspector Component (Redesigned Dual-Language)
   ============================================================ */
function toEditorHtml(value: string): string {
  let result = value
    .replace(
      /font-family\s*:\s*serif-italic\b/gi,
      "font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500"
    )
    .replace(
      /font-family\s*:\s*serif\b/gi,
      "font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-style: normal; font-weight: 400"
    );

  for (let pass = 0; pass < 3; pass++) {
    const decoded = result.replace(/&(#x[0-9a-f]+|#\d+|amp|nbsp);/gi, (entity, code) => {
      const key = String(code).toLowerCase();
      if (key === "amp") return "&";
      if (key === "nbsp") return " ";
      if (key.startsWith("#x")) return String.fromCodePoint(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCodePoint(parseInt(key.slice(1), 10));
      return entity;
    });
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}

function RichTextEditable({
  editorRef,
  value,
  onChange,
  className,
  placeholder,
}: {
  editorRef: React.RefObject<HTMLDivElement>;
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder: string;
}) {
  const editorHtml = toEditorHtml(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== editorHtml) {
      editor.innerHTML = editorHtml;
    }
  }, [editorHtml, editorRef]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      className={cn(className, "min-h-[6rem] overflow-y-auto whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-[#92816A] empty:before:pointer-events-none")}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          document.execCommand("insertLineBreak");
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
      }}
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
    />
  );
}

function VisualTabContent({
  target,
  values,
  setValues,
  setTarget,
  ready,
  saving,
  msg,
  setMsg,
  onSave,
  previewLang,
  setPreviewLang,
  KindIcon,
}: {
  target: LiveEditTarget | null;
  values: LiveEditValues;
  setValues: React.Dispatch<React.SetStateAction<LiveEditValues>>;
  setTarget: (t: LiveEditTarget | null) => void;
  ready: boolean;
  saving: boolean;
  msg: { type: "ok" | "err"; text: string } | null;
  setMsg: React.Dispatch<React.SetStateAction<{ type: "ok" | "err"; text: string } | null>>;
  onSave: () => Promise<void>;
  previewLang: "it" | "en";
  setPreviewLang: (l: "it" | "en") => void;
  KindIcon: any;
}) {
  const [langViewMode, setLangViewMode] = useState<"tab" | "both">("both");
  const [activeLangTab, setActiveLangTab] = useState<"it" | "en">(previewLang);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const autoTranslateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Link insertion state ----
  const [linkPanel, setLinkPanel] = useState<{
    open: boolean;
    targetLang: "it" | "en";
    linkText: string;
    linkUrl: string;
  }>({ open: false, targetLang: "it", linkText: "", linkUrl: "" });
  const itTextareaRef = useRef<HTMLDivElement>(null);
  const enTextareaRef = useRef<HTMLDivElement>(null);

  const singleTabTextareaRef = useRef<HTMLDivElement>(null);
  type TextSelection = { range: Range; text: string };
  const selectionRef = useRef<Partial<Record<"it" | "en", TextSelection>>>({});

  function getTextareaRef(lang: "it" | "en") {
    if (langViewMode === "tab" && activeLangTab === lang) return singleTabTextareaRef;
    return lang === "it" ? itTextareaRef : enTextareaRef;
  }

  /** Conserva la selezione prima che la toolbar sposti il focus dall'editor. */
  function rememberSelection(lang: "it" | "en"): TextSelection | null {
    const el = getTextareaRef(lang).current;
    const browserSelection = window.getSelection();
    if (!el || !browserSelection?.rangeCount) return null;
    const range = browserSelection.getRangeAt(0);
    if (range.collapsed || !el.contains(range.commonAncestorContainer)) return null;
    const selection = {
      range: range.cloneRange(),
      text: range.toString(),
    };
    selectionRef.current[lang] = selection;
    return selection;
  }

  function getRememberedSelection(lang: "it" | "en"): TextSelection | null {
    const el = getTextareaRef(lang).current;
    const remembered = selectionRef.current[lang];
    if (remembered && el?.contains(remembered.range.commonAncestorContainer)) {
      return remembered;
    }
    return rememberSelection(lang);
  }

  function wrapSelection(lang: "it" | "en", wrapFn: (text: string) => string) {
    const ref = getTextareaRef(lang);
    const el = ref.current;
    if (!el) return 0;
    const selection = getRememberedSelection(lang);
    if (!selection) {
      setMsg({ type: "err", text: "Seleziona prima una porzione di testo nella casella sottostante." });
      setTimeout(() => setMsg(null), 2800);
      return 0;
    }
    const wrapped = wrapFn(selection.text);
    const style = wrapped.match(/^<span style="([^"]*)">/i)?.[1];
    if (!style) return 0;

    const range = selection.range;
    const wrapper = document.createElement("span");
    wrapper.setAttribute("style", style);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    el.normalize();
    setValues((prev: LiveEditValues) => ({ ...prev, [lang]: el.innerHTML }));

    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    const browserSelection = window.getSelection();
    browserSelection?.removeAllRanges();
    browserSelection?.addRange(nextRange);
    selectionRef.current[lang] = { range: nextRange.cloneRange(), text: wrapper.textContent ?? "" };
    return wrapped.length;
  }

  const openLinkPanel = (lang: "it" | "en") => {
    const selection = rememberSelection(lang);
    if (!selection) {
      setMsg({ type: "err", text: "Seleziona prima una porzione di testo a cui applicare il link." });
      setTimeout(() => setMsg(null), 2800);
      return;
    }
    setLinkPanel({ open: true, targetLang: lang, linkText: selection.text, linkUrl: "" });
  };

  const insertLink = () => {
    const { targetLang, linkText, linkUrl } = linkPanel;
    if (!linkUrl.trim()) return;
    const markdown = linkText.trim()
      ? `[${linkText}](${linkUrl})`
      : `[${linkUrl}](${linkUrl})`;

    const ref = getTextareaRef(targetLang);
    const el = ref.current;
    const selection = getRememberedSelection(targetLang);
    if (el && selection) {
      const range = selection.range;
      range.deleteContents();
      const textNode = document.createTextNode(markdown);
      range.insertNode(textNode);
      el.normalize();
      setValues((prev: LiveEditValues) => ({ ...prev, [targetLang]: el.innerHTML }));
    } else {
      setValues((prev: LiveEditValues) => ({
        ...prev,
        [targetLang]: (prev[targetLang] ?? "") + markdown,
      }));
    }
    setLinkPanel((p) => ({ ...p, open: false, linkText: "", linkUrl: "" }));
  };

  function applyInlineStyle(
    lang: "it" | "en",
    styleChanges: {
      fontFamily?: string;
      fontStyle?: string;
      fontWeight?: string;
      color?: string;
    }
  ) {
    const ref = getTextareaRef(lang);
    const el = ref.current;
    if (!el) return;
    const selection = getRememberedSelection(lang);
    if (!selection || !selection.text.trim()) {
      setMsg({ type: "err", text: "Seleziona prima una porzione di testo a cui applicare lo stile." });
      setTimeout(() => setMsg(null), 2500);
      return;
    }

    const range = selection.range;

    // Se la selezione corrisponde o è contenuta in uno span già stilato, aggiorna direttamente le proprietà
    let targetSpan: HTMLSpanElement | null = null;
    const common = range.commonAncestorContainer;
    if (common.nodeType === Node.ELEMENT_NODE && (common as HTMLElement).tagName === "SPAN" && common !== el) {
      targetSpan = common as HTMLSpanElement;
    } else if (common.parentElement && common.parentElement.tagName === "SPAN" && common.parentElement !== el) {
      targetSpan = common.parentElement as HTMLSpanElement;
    }

    let appliedStyle = "";

    if (targetSpan && (targetSpan.textContent?.trim() === selection.text.trim() || targetSpan.contains(range.commonAncestorContainer))) {
      if (styleChanges.fontFamily !== undefined) targetSpan.style.fontFamily = styleChanges.fontFamily;
      if (styleChanges.fontStyle !== undefined) targetSpan.style.fontStyle = styleChanges.fontStyle;
      if (styleChanges.fontWeight !== undefined) targetSpan.style.fontWeight = styleChanges.fontWeight;
      if (styleChanges.color !== undefined) targetSpan.style.color = styleChanges.color;

      appliedStyle = targetSpan.getAttribute("style") ?? "";
      el.normalize();
      setValues((prev: LiveEditValues) => ({ ...prev, [lang]: el.innerHTML }));

      const nextRange = document.createRange();
      nextRange.selectNodeContents(targetSpan);
      const browserSelection = window.getSelection();
      browserSelection?.removeAllRanges();
      browserSelection?.addRange(nextRange);
      selectionRef.current[lang] = { range: nextRange.cloneRange(), text: targetSpan.textContent ?? "" };

      setMsg({ type: "ok", text: "Stile applicato!" });
      setTimeout(() => setMsg(null), 1800);
      return;
    }

    // Altrimenti crea un nuovo span wrapper per la porzione selezionata
    const wrapper = document.createElement("span");
    const styleParts: string[] = [];
    if (styleChanges.fontFamily) styleParts.push(`font-family:${styleChanges.fontFamily}`);
    if (styleChanges.fontStyle) styleParts.push(`font-style:${styleChanges.fontStyle}`);
    if (styleChanges.fontWeight) styleParts.push(`font-weight:${styleChanges.fontWeight}`);
    if (styleChanges.color) styleParts.push(`color:${styleChanges.color}`);

    if (styleParts.length > 0) {
      wrapper.setAttribute("style", styleParts.join(";"));
    }
    appliedStyle = wrapper.getAttribute("style") ?? "";

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    el.normalize();
    setValues((prev: LiveEditValues) => ({ ...prev, [lang]: el.innerHTML }));

    // Mantieni la selezione sul nuovo elemento per permettere click consecutivi istantanei (es: font poi colore)
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    const browserSelection = window.getSelection();
    browserSelection?.removeAllRanges();
    browserSelection?.addRange(nextRange);
    selectionRef.current[lang] = { range: nextRange.cloneRange(), text: wrapper.textContent ?? "" };

    setMsg({ type: "ok", text: "Stile applicato!" });
    setTimeout(() => setMsg(null), 1800);
  }

  const stripSelectionFormatting = (lang: "it" | "en") => {
    const ref = getTextareaRef(lang);
    const el = ref.current;
    if (!el) return;
    const selection = getRememberedSelection(lang);

    if (selection && selection.text.trim()) {
      const selectedText = selection.text.trim();
      const range = selection.range;
      const common = range.commonAncestorContainer;
      const parentSpan =
        common.nodeType === Node.ELEMENT_NODE && (common as HTMLElement).tagName === "SPAN" && common !== el
          ? (common as HTMLElement)
          : common.parentElement && common.parentElement.tagName === "SPAN" && common.parentElement !== el
          ? (common.parentElement as HTMLElement)
          : null;

      if (parentSpan && parentSpan.textContent?.trim() === selectedText) {
        const textNode = document.createTextNode(parentSpan.textContent);
        parentSpan.parentNode?.replaceChild(textNode, parentSpan);
      } else {
        const textNode = document.createTextNode(selection.text);
        range.deleteContents();
        range.insertNode(textNode);
      }
      el.normalize();
      setValues((prev: LiveEditValues) => ({ ...prev, [lang]: el.innerHTML }));
      setMsg({ type: "ok", text: "Formattazione rimossa dalla selezione." });
    } else {
      const current = lang === "it" ? (values.it ?? "") : (values.en ?? "");
      if (!current.trim()) return;
      const cleaned = stripAllFormatting(current);
      setValues((prev: LiveEditValues) => ({ ...prev, [lang]: cleaned }));
      setMsg({ type: "ok", text: "Formattazione rimossa dall'intero campo." });
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const renderFormattingToolbar = (lang: "it" | "en") => (
    <div
      className="flex flex-wrap items-center gap-1.5 py-0.5 px-1 bg-[#FAF4EB] border border-[#E9DCC4] rounded-sm"
      onMouseDownCapture={() => rememberSelection(lang)}
    >
      {/* Bottoni Font Diretti a 1 Click */}
      <div className="flex items-center gap-1 pr-1 border-r border-[#E0D0B6]">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            rememberSelection(lang);
            applyInlineStyle(lang, {
              fontFamily: "'Cormorant Garamond','Playfair Display',Georgia,serif",
              fontStyle: "italic",
              fontWeight: "500",
            });
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-serif italic text-[#7A5828] bg-white hover:bg-[#A87E3C]/15 border border-[#A87E3C]/40 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Applica Cormorant Garamond Corsivo (1 click)"
        >
          <Type className="w-3 h-3 italic text-[#A87E3C]" />
          <span style={{ fontFamily: "'Cormorant Garamond','Playfair Display',Georgia,serif" }}>Corsivo</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            rememberSelection(lang);
            applyInlineStyle(lang, {
              fontFamily: "'Cormorant Garamond','Playfair Display',Georgia,serif",
              fontStyle: "normal",
              fontWeight: "400",
            });
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-serif text-[#7A5828] bg-white hover:bg-[#A87E3C]/15 border border-[#A87E3C]/40 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Applica Cormorant Garamond Regolare (1 click)"
        >
          <span style={{ fontFamily: "'Cormorant Garamond','Playfair Display',Georgia,serif" }}>Serif</span>
        </button>
      </div>

      {/* Palette Colori Brand Istantanea */}
      <div className="flex items-center gap-1 pr-1 border-r border-[#E0D0B6]">
        {[
          { color: "#9C1C1C", name: "Terracotta" },
          { color: "#A87E3C", name: "Oro caldo" },
          { color: "#3D6E90", name: "Blu" },
          { color: "#4A6535", name: "Verde oliva" },
          { color: "#1E160A", name: "Marrone scuro" },
        ].map((c) => (
          <button
            key={c.color}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              rememberSelection(lang);
              applyInlineStyle(lang, { color: c.color });
            }}
            className="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-125 transition-transform cursor-pointer active:scale-95"
            style={{ backgroundColor: c.color }}
            title={`Applica colore ${c.name} (${c.color})`}
          />
        ))}

        {/* Color picker personalizzato */}
        <label
          onMouseDown={() => {
            rememberSelection(lang);
          }}
          className="w-4.5 h-4.5 rounded-full bg-white border border-[#C4B49A] hover:border-[#7A5828] flex items-center justify-center cursor-pointer shadow-xs hover:scale-110 transition-transform relative ml-0.5"
          title="Scegli colore personalizzato"
        >
          <Palette className="w-2.5 h-2.5 text-[#5C4C38]" />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => {
              applyInlineStyle(lang, { color: e.target.value });
            }}
          />
        </label>
      </div>

      {/* Link e Pulisci */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            rememberSelection(lang);
            openLinkPanel(lang);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#3D6E90] bg-white hover:bg-[#3D6E90]/10 border border-[#3D6E90]/30 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Inserisci link sulla selezione"
        >
          <Link2 className="w-3 h-3" />
          Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            rememberSelection(lang);
            stripSelectionFormatting(lang);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#7A6655] bg-white hover:bg-[#7A6655]/10 border border-[#92816A]/40 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Rimuovi formattazione (font, colore, span)"
        >
          <Eraser className="w-3 h-3" />
          Pulisci
        </button>
      </div>
    </div>
  );

  const lastTargetId = useRef<string | null>(null);
  const lastTranslatedIt = useRef<string>("");

  // DEFINISCI PRIMA le variabili itText ed enText
  const itText = values.it ?? "";
  const enText = values.en ?? "";

  // === Calcolo flag per Editor Immagini/Video vs Testo ===
  const sk = target?.stringKey ?? "";
  const idStr = target?.id ?? "";
  const skLower = sk.toLowerCase();
  const idLower = idStr.toLowerCase();
  const isVideoTextualId =
    /video.*(title|desc|btn|text|label|subtitle|heading|claim)$/i.test(idStr) ||
    /(title|desc|btn|text|label|subtitle|heading|claim).*video$/i.test(idStr);
  const isVideoTextualSk =
    (/(title|desc|btn|text|label|subtitle|heading|claim)$/i.test(sk) && skLower.includes("video")) ||
    (/^video/i.test(sk) && /(title|desc|btn|text|label|subtitle|heading|claim)/i.test(sk));

  const showMediaPicker: boolean = !!(
    target &&
    (target.kind === "image" ||
      (target.kind === "media_item" && target.mediaItemField !== "caption") ||
      idLower.includes("bg_image") ||
      idLower.includes("photo") ||
      (idLower.includes("video") && !isVideoTextualId) ||
      (sk !== "" &&
        (skLower.includes("image") ||
          skLower.includes("bg") ||
          skLower.includes("photo") ||
          (skLower.includes("video") &&
            !isVideoTextualSk &&
            (skLower.includes("src") || skLower.includes("poster") || skLower.includes("url"))))))
  );
  const isVideoUrl: boolean =
    !!(target &&
      ((idLower.includes("video") && !isVideoTextualId) ||
        (skLower.includes("video") &&
          !isVideoTextualSk &&
          (skLower.includes("src") || skLower.includes("poster") || skLower.includes("url")))));
  const showIconPicker = !!(
    target &&
    (idLower.includes("icon") || (sk !== "" && skLower.includes("icon")))
  );
  const showBannerColorPicker = target?.kind === "style" && target.id === "slow.banner.color";
  const showProfileNumber = !!(target && target.kind === "profile_number");

  // Sincronizza il tab attivo quando cambia l'anteprima o il target
  useEffect(() => {
    setActiveLangTab(previewLang);
  }, [previewLang, target?.id]);

  // Sincronizza l'ultimo testo IT visto al cambio target
  useEffect(() => {
    if (target?.id !== lastTargetId.current) {
      lastTargetId.current = target?.id ?? null;
      lastTranslatedIt.current = values.it ?? "";
    }
  }, [target?.id]);

  // AUTO-TRANSLATE UNIDIREZIONALE (IT -> EN)
  useEffect(() => {
    if (!itText || itText.trim().length < 2 || itText === lastTranslatedIt.current) {
      return;
    }

    if (autoTranslateTimeoutRef.current) {
      clearTimeout(autoTranslateTimeoutRef.current);
    }

    autoTranslateTimeoutRef.current = setTimeout(async () => {
      setIsAutoTranslating(true);
      try {
        const translated = await translateText(itText.trim(), "it", "en");
        if (translated && translated !== itText.trim()) {
          lastTranslatedIt.current = itText;
          setValues((prev: LiveEditValues) => ({ ...prev, en: translated }));
        }
      } finally {
        setIsAutoTranslating(false);
      }
    }, 1500);

    return () => {
      if (autoTranslateTimeoutRef.current) {
        clearTimeout(autoTranslateTimeoutRef.current);
      }
    };
  }, [itText]);

  if (!target) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="w-16 h-16 rounded-full bg-[#B22A2A]/10 flex items-center justify-center mb-4 text-[#B22A2A] shadow-inner">
          <MousePointerClick className="w-8 h-8 animate-bounce" />
        </div>
        <p className="text-base font-serif font-semibold text-[#1E160A] mb-1.5">
          Clicca un elemento nel sito per modificarlo
        </p>
        <p className="text-xs text-[#7A6655] leading-relaxed max-w-[320px]">
          Qualsiasi testo, titolo, FAQ, citazione, biografia o immagine dell&apos;anteprima a destra può essere modificato al volo semplicemente cliccandoci sopra.
        </p>
        {!ready && (
          <div className="mt-5 p-2 px-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            Caricamento anteprima reattiva…
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Target Info Card */}
      <div className="p-3.5 bg-gradient-to-r from-[#F9F4EC] to-white border border-[#E9DCC4] rounded-sm shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#B22A2A]/10 border border-[#B22A2A]/30 flex items-center justify-center shrink-0">
            <KindIcon className="w-5 h-5 text-[#B22A2A]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#B22A2A]/15 text-[#9C1C1C]">
                {target.kind === "info_item"
                  ? "FAQ & Domande"
                  : target.kind === "quote"
                    ? "Citazione"
                    : target.kind === "profile"
                      ? "Profilo"
                      : target.kind === "credential"
                        ? "Credenziale"
                        : target.kind === "contact"
                          ? "Contatto"
                          : target.kind === "media_item"
                            ? "Media & Galleria"
                            : target.kind === "image"
                              ? "Immagine"
                              : "Testo Interfaccia"}
              </span>
              {target.section && (
                <span className="text-[10px] text-[#7A6655] font-medium truncate">
                  Sezione: <strong className="text-[#2E2010]">{target.section}</strong>
                </span>
              )}
            </div>
            <p className="font-semibold text-[#1E160A] text-sm mt-1 truncate">
              {target.label}
            </p>
            {target.stringKey && (
              <code className="text-[10px] text-[#92816A] font-mono block mt-0.5 truncate">
                {target.stringKey}
              </code>
            )}
          </div>
        </div>
      </div>

      {/* Editor per Immagini e Video */}
      {showMediaPicker ? (
        <MediaPickerModal
          value={values.url || values.it || ""}
          onChange={(newUrl) => setValues({ ...values, url: newUrl, it: newUrl, en: newUrl })}
          isVideo={isVideoUrl}
          posterValue={values.en || ""}
          onPosterChange={(newPoster) => setValues({ ...values, en: newPoster })}
          title={`Gestione ${target.label}`}
        />
      ) : showBannerColorPicker ? (
        <div className="space-y-4 p-4 bg-white border border-[#E9DCC4] rounded-sm shadow-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">Colore della card</label>
            <p className="text-[11px] text-[#7A6655] mt-1">Il testo passa automaticamente a chiaro o scuro per mantenere un contrasto leggibile. L&apos;immagine di sfondo resta gestibile separatamente.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(values.it ?? "") ? values.it : "#F9F4EC"}
              onChange={(e) => setValues({ ...values, it: e.target.value, en: e.target.value })}
              className="w-12 h-12 p-0 border border-[#E9DCC4] rounded-sm bg-white cursor-pointer"
            />
            <input
              value={values.it ?? ""}
              onChange={(e) => setValues({ ...values, it: e.target.value, en: e.target.value })}
              placeholder="#F9F4EC"
              className="inpt flex-1 font-mono text-sm"
            />
          </div>
          <div className="h-24 rounded-sm border border-black/10 shadow-inner" style={{ backgroundColor: values.it || "#F9F4EC" }}>
            <div className="h-full flex items-center justify-center text-sm font-semibold" style={{ color: "#1E160A" }}>Anteprima colore banner</div>
          </div>
        </div>
      ) : showIconPicker ? (
        <div className="space-y-3 p-4 bg-white border border-[#E9DCC4] rounded-sm shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">Scegli Icona</label>
          <div className="flex items-center gap-3 mb-2 p-2 bg-[#F9F4EC] border border-[#E9DCC4] rounded-sm">
            <div className="w-10 h-10 rounded-sm bg-[#B22A2A]/15 text-[#B22A2A] flex items-center justify-center font-bold">
              {renderIconByName(values.it || values.en || "Sparkles", { className: "w-5 h-5" })}
            </div>
            <div>
              <p className="text-xs font-bold text-[#2E2010]">Icona selezionata: {values.it || values.en || "Nessuna"}</p>
              <p className="text-[10px] text-[#7A6655]">Clicca su una nuova icona nel riquadro sottostante</p>
            </div>
          </div>
          <IconPicker
            value={values.it || values.en}
            onChange={(iconName) => setValues({ ...values, it: iconName, en: iconName })}
            onClose={() => { }}
            className="static w-full shadow-none border-[#E9DCC4]"
          />
        </div>
      ) : showProfileNumber ? (
        <div className="space-y-3 p-4 bg-white border border-[#E9DCC4] rounded-sm shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">Valore numerico</label>
          <input
            type="number"
            className="inpt text-base font-semibold text-[#1E160A] w-full"
            value={values.it ?? ""}
            onChange={(e) => setValues({ ...values, it: e.target.value, en: e.target.value })}
            placeholder="es. 20"
          />
        </div>
      ) : (
        /* Editor Bilingue Avanzato & Pulito */
        <div className="space-y-3">
          {/* Header Switcher Modalità Traduzione */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E9DCC4]">
            <div className="flex rounded-sm bg-[#F0E8D6] p-0.5 border border-[#E9DCC4]">
              <button
                type="button"
                onClick={() => setLangViewMode("both")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all flex items-center gap-1",
                  langViewMode === "both" ? "bg-white text-[#1E160A] shadow-sm" : "text-[#7A6655] hover:text-[#2E2010]"
                )}
              >
                <span>Entrambe le lingue</span>
              </button>
              <button
                type="button"
                onClick={() => setLangViewMode("tab")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all flex items-center gap-1",
                  langViewMode === "tab" ? "bg-white text-[#1E160A] shadow-sm" : "text-[#7A6655] hover:text-[#2E2010]"
                )}
              >
                <span>A schede singole</span>
              </button>
            </div>

            {/* ✅ BOTTONE TRADUCI FUORI, SEMPRE VISIBILE */}
            <TranslateButton
              sourceText={itText}
              onTranslated={(translated) => {
                lastTranslatedIt.current = itText;
                setValues((prev: LiveEditValues) => ({ ...prev, en: translated }));
              }}
              size="sm"
            />
          </div>

          {/* Sezione Schede Singole */}
          {langViewMode === "tab" ? (
            <div
              className={cn(
                "p-4 rounded-sm shadow-sm space-y-2 border transition-all",
                activeLangTab === "it"
                  ? "bg-white border-[#E9DCC4] focus-within:border-[#B22A2A] focus-within:ring-1 focus-within:ring-[#B22A2A]"
                  : "bg-white border-[#E9DCC4] focus-within:border-[#3D6E90] focus-within:ring-1 focus-within:ring-[#3D6E90]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex rounded-sm overflow-hidden border border-[#E9DCC4]">
                  {(["it", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setActiveLangTab(l)}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        activeLangTab === l
                          ? l === "it"
                            ? "bg-[#B22A2A] text-white"
                            : "bg-[#3D6E90] text-white"
                          : "bg-white text-[#5C4C38] hover:bg-[#F0E8D6]"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                  <span className="text-[10px] text-[#92816A] font-mono">
                    {(activeLangTab === "it" ? itText : enText).length} caratteri
                  </span>
                  {renderFormattingToolbar(activeLangTab)}
                </div>
              </div>
              <RichTextEditable
                editorRef={singleTabTextareaRef}
                className={cn(
                  "inpt text-sm leading-relaxed w-full resize-y p-3 rounded-sm",
                  activeLangTab === "it"
                    ? "focus:ring-2 focus:ring-[#B22A2A] border-[#C4B49A]"
                    : "focus:ring-2 focus:ring-[#3D6E90] border-[#C4B49A]"
                )}
                value={activeLangTab === "it" ? itText : enText}
                placeholder={activeLangTab === "it" ? "Inserisci il testo in italiano…" : "Insert English text…"}
                onChange={(e) => {
                  if (activeLangTab === "it") {
                    setValues({ ...values, it: e });
                  } else {
                    setValues({ ...values, en: e });
                  }
                }}
              />
              <div className="mt-2 p-2.5 bg-[#F9F4EC]/70 border border-[#E9DCC4] rounded-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6655] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Anteprima — come apparirà nel sito
                  </span>
                  <span className="text-[9px] text-[#92816A] font-mono">
                    {activeLangTab.toUpperCase()}
                  </span>
                </div>
                <div className="px-2 py-2 bg-white rounded-sm border border-[#E9DCC4]/60 text-[13px] text-[#1E160A] leading-relaxed min-h-[32px]">
                  {renderWithLinks(activeLangTab === "it" ? itText : enText) || <span className="opacity-40 italic">Nessun testo da mostrare</span>}
                </div>
              </div>
            </div>
          ) : (
            /* Sezione Entrambe le Lingue */
            <>
              <div className="space-y-3">
                {/* Card Italiano */}
                <div className="p-3.5 bg-white border border-[#E9DCC4] rounded-sm shadow-sm space-y-1.5 focus-within:border-[#B22A2A] focus-within:ring-1 focus-within:ring-[#B22A2A] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2E2010] flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-[#E9DCC4] text-[#5C4C38] rounded uppercase tracking-wider">IT</span> Italiano
                      {isAutoTranslating && (
                        <span className="text-[10px] text-[#3D6E90] flex items-center gap-1 ml-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Traduzione automatica...
                        </span>
                      )}
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                      <span className="text-[10px] text-[#92816A] font-mono">{itText.length} caratteri</span>
                      {renderFormattingToolbar("it")}
                    </div>
                  </div>
                  <RichTextEditable
                    editorRef={itTextareaRef}
                    className="w-full text-sm leading-relaxed p-2.5 bg-[#F9F4EC]/50 border border-[#E9DCC4] rounded-sm resize-y focus:outline-none focus:bg-white text-[#1E160A]"
                    value={itText}
                    placeholder="Testo in italiano…"
                    onChange={(value) => setValues({ ...values, it: value })}
                  />
                  <div className="mt-1.5 p-2 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#7A6655] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Anteprima IT
                      </span>
                    </div>
                    <div className="px-2 py-1.5 bg-white rounded-sm border border-[#E9DCC4]/60 text-[12px] text-[#1E160A] leading-relaxed min-h-[28px]">
                      {renderWithLinks(itText) || <span className="opacity-40 italic">Nessun testo</span>}
                    </div>
                  </div>
                </div>

                {/* Card Inglese */}
                <div className="p-3.5 bg-white border border-[#E9DCC4] rounded-sm shadow-sm space-y-1.5 focus-within:border-[#3D6E90] focus-within:ring-1 focus-within:ring-[#3D6E90] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2E2010] flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-[#3D6E90]/10 text-[#3D6E90] rounded uppercase tracking-wider">EN</span> English
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                      <span className="text-[10px] text-[#92816A] font-mono">{enText.length} caratteri</span>
                      {renderFormattingToolbar("en")}
                    </div>
                  </div>
                  <RichTextEditable
                    editorRef={enTextareaRef}
                    className="w-full text-sm leading-relaxed p-2.5 bg-[#F9F4EC]/50 border border-[#E9DCC4] rounded-sm resize-y focus:outline-none focus:bg-white text-[#1E160A]"
                    value={enText}
                    placeholder="English translation…"
                    onChange={(value) => {
                      setValues({ ...values, en: value });
                    }}
                  />
                  <div className="mt-1.5 p-2 bg-[#F9F4EC]/60 border border-[#E9DCC4] rounded-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#7A6655] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Preview EN
                      </span>
                    </div>
                    <div className="px-2 py-1.5 bg-white rounded-sm border border-[#E9DCC4]/60 text-[12px] text-[#1E160A] leading-relaxed min-h-[28px]">
                      {renderWithLinks(enText) || <span className="opacity-40 italic">No text</span>}
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

          {/* Link Insertion Panel (Condiviso) */}
          {linkPanel.open && (
            <div className="mt-3 p-3.5 bg-[#EFF6FF] border border-[#3D6E90]/40 rounded-sm shadow-sm space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E4670] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Inserisci Link — {linkPanel.targetLang.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setLinkPanel((p) => ({ ...p, open: false }))}
                  className="w-6 h-6 rounded-full hover:bg-[#3D6E90]/10 flex items-center justify-center text-[#3D6E90]"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#1E4670] mb-1">Testo visualizzato</label>
                <input
                  className="w-full px-2.5 py-1.5 text-xs border border-[#3D6E90]/30 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6E90]/30"
                  value={linkPanel.linkText}
                  onChange={(e) => setLinkPanel((p) => ({ ...p, linkText: e.target.value }))}
                  placeholder="es. Scopri di più"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#1E4670] mb-1">URL del link</label>
                <input
                  className="w-full px-2.5 py-1.5 text-xs border border-[#3D6E90]/30 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6E90]/30 font-mono"
                  value={linkPanel.linkUrl}
                  onChange={(e) => setLinkPanel((p) => ({ ...p, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLinkPanel((p) => ({ ...p, open: false }))}
                  className="flex-1 py-1.5 text-xs font-semibold text-[#5C4C38] border border-[#E9DCC4] rounded-sm hover:bg-[#F0E8D6] transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkPanel.linkUrl.trim()}
                  className="flex-1 py-1.5 text-xs font-bold bg-[#3D6E90] text-white rounded-sm hover:bg-[#2E5570] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Link2 className="w-3 h-3" />
                  Inserisci
                </button>
              </div>
              <p className="text-[10px] text-[#3D6E90]/70">
                Verrà inserito nel testo come: <code className="font-mono bg-white px-1 rounded">[{linkPanel.linkText || "testo"}]({linkPanel.linkUrl || "url"})</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messaggio di Feedback */}
      {msg && (
        <div className={cn("text-xs px-3.5 py-2.5 rounded-sm border flex items-center gap-2 shadow-sm", msg.type === "ok" ? "bg-[#4A6535]/15 border-[#4A6535]/40 text-[#3A5228]" : "bg-[#9C1C1C]/15 border-[#9C1C1C]/40 text-[#9C1C1C]")}>
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Pulsanti Azione */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => { setTarget(null); setValues(EMPTY); }}
          className="flex-1 px-4 py-2.5 rounded-sm text-xs font-semibold text-[#5C4C38] hover:bg-[#F0E8D6] border border-[#E9DCC4] transition-colors"
        >
          Annulla
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] disabled:opacity-60 shadow-sm transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salva nel sito
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 2: Profile & Contacts Tab Content
   ============================/* ============================================================
   TAB 2: Profile & Contacts Tab Content (Redesigned & Auto-Translate)
   ============================================================ */
function ProfileTabContent({
  profileId,
  onSaved,
}: {
  profileId: string | null;
  onSaved: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select(`*, contacts (*), credentials (*)`)
      .limit(1)
      .maybeSingle();
    setProfile(data ?? null);
    setContacts(data?.contacts ?? []);
    setCredentials(data?.credentials ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSaveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const pid = profile?.id || profileId || crypto.randomUUID();
      const pPayload = {
        id: pid,
        first_name_it: profile?.first_name_it || "Davide",
        first_name_en: profile?.first_name_en || "Davide",
        last_name_it: profile?.last_name_it || "Apolloni",
        last_name_en: profile?.last_name_en || "Apolloni",
        title_it: profile?.title_it || "",
        title_en: profile?.title_en || "",
        bio_short_it: profile?.bio_short_it || "",
        bio_short_en: profile?.bio_short_en || "",
        bio_long_it: profile?.bio_long_it || null,
        bio_long_en: profile?.bio_long_en || null,
        photo_url: profile?.photo_url || null,
        experience_years: Number(profile?.experience_years ?? 20),
        academic_badge_it: profile?.academic_badge_it || null,
        academic_badge_en: profile?.academic_badge_en || null,
        slow_tourism_claim_it: profile?.slow_tourism_claim_it || null,
        slow_tourism_claim_en: profile?.slow_tourism_claim_en || null,
        operating_area_it: profile?.operating_area_it || null,
        operating_area_en: profile?.operating_area_en || null,
      };

      const { error: pErr } = await (supabase.from("profiles") as any).upsert(pPayload, {
        onConflict: "id",
      });
      if (pErr) throw pErr;

      // Upsert contacts
      if (contacts.length > 0) {
        const cPayload = contacts.map((c, i) => ({
          ...c,
          id: c.id || crypto.randomUUID(),
          profile_id: pid,
          sort_order: c.sort_order ?? i,
        }));
        const { error: cErr } = await (supabase.from("contacts") as any).upsert(cPayload, {
          onConflict: "id",
        });
        if (cErr) throw cErr;
      }

      // Upsert credentials
      if (credentials.length > 0) {
        const credPayload = credentials.map((cr, i) => ({
          ...cr,
          id: cr.id || crypto.randomUUID(),
          profile_id: pid,
          sort_order: cr.sort_order ?? i,
        }));
        const { error: crErr } = await (supabase.from("credentials") as any).upsert(
          credPayload,
          { onConflict: "id" }
        );
        if (crErr) throw crErr;
      }

      setMsg({ type: "ok", text: "✓ Profilo, contatti e credenziali salvati con successo!" });
      onSaved();
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio profilo") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#92816A]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#9C1C1C]" />
        Caricamento dati profilo…
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header with Save button — NOT sticky to avoid overlap */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E9DCC4]">
        <div>
          <h2 className="font-serif font-semibold text-[#1E160A] text-sm flex items-center gap-1.5">
            <UserCog2 className="w-4 h-4 text-[#9C1C1C]" />
            Profilo & Informazioni Personali
          </h2>
          <p className="text-[11px] text-[#7A6655] mt-0.5">
            Dati biografici, contatti e credenziali bilingui
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSaveProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] disabled:opacity-60 shadow-sm transition-all shrink-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salva tutto
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            "text-xs px-3.5 py-2.5 rounded-sm border flex items-center gap-2 shadow-sm",
            msg.type === "ok"
              ? "bg-[#4A6535]/15 border-[#4A6535]/40 text-[#3A5228]"
              : "bg-[#9C1C1C]/15 border-[#9C1C1C]/40 text-[#9C1C1C]"
          )}
        >
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 1. Anagrafica & Foto */}
      <div className="bg-[#F9F4EC] p-4 rounded-sm border border-[#E9DCC4] space-y-3">
        <div className="flex items-center gap-2 border-b border-black/5 pb-2">
          <UserCog2 className="w-3.5 h-3.5 text-[#9C1C1C]" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#3D2E1A]">1. Anagrafica & Foto Profilo</h3>
        </div>

        {/* Nome + Cognome */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-[#7A6655] block mb-1">Nome</label>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={profile?.first_name_it || ""}
              onChange={(e) => setProfile({ ...profile, first_name_it: e.target.value, first_name_en: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#7A6655] block mb-1">Cognome</label>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={profile?.last_name_it || ""}
              onChange={(e) => setProfile({ ...profile, last_name_it: e.target.value, last_name_en: e.target.value })}
            />
          </div>
        </div>

        {/* Anni esperienza */}
        <div className="w-1/2">
          <label className="text-[10px] font-semibold text-[#7A6655] block mb-1">Anni di Esperienza</label>
          <input
            type="number"
            className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
            value={profile?.experience_years ?? 20}
            onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })}
          />
        </div>

        {/* Distintivo accademico */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-[#7A6655]">Distintivo Accademico</label>
            <TranslateButton sourceText={profile?.academic_badge_it || ""} onTranslated={(t) => setProfile((p: any) => p ? { ...p, academic_badge_en: t } : p)} />
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1">
              <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
              <input
                className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
                value={profile?.academic_badge_it || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile((p: any) => p ? { ...p, academic_badge_it: val } : p);
                  triggerAutoTranslate("p_badge", val, (t) => setProfile((p: any) => p ? { ...p, academic_badge_en: t } : p));
                }}
                placeholder="es. Laureato in Lettere"
              />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
              <input className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none" value={profile?.academic_badge_en || ""} onChange={(e) => setProfile((p: any) => p ? { ...p, academic_badge_en: e.target.value } : p)} placeholder="e.g. Degree in Literature" />
            </div>
          </div>
        </div>

        {/* Foto Profilo */}
        <div>
          <label className="text-[10px] font-semibold text-[#7A6655] block mb-1.5">Foto Profilo</label>
          <div className="flex items-center gap-2">
            {profile?.photo_url && (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C4923A]/50 shrink-0">
                <img src={profile.photo_url} alt="foto" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              className="flex-1 text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm font-mono focus:border-[#9C1C1C] focus:outline-none min-w-0"
              value={profile?.photo_url || ""}
              onChange={(e) => setProfile((p: any) => p ? { ...p, photo_url: e.target.value } : p)}
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={() => setPhotoPickerOpen(true)}
              className="px-2.5 py-2 bg-white border border-[#C4B49A] hover:bg-[#E9DCC4]/50 rounded-sm text-xs font-semibold text-[#5C4C38] flex items-center gap-1 shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#9C1C1C]" />
              Sfoglia
            </button>
          </div>
        </div>
      </div>

      {/* 2. Titolo & Filosofia */}
      <div className="bg-[#F9F4EC] p-4 rounded-sm border border-[#E9DCC4] space-y-3">
        <div className="flex items-center gap-2 border-b border-black/5 pb-2">
          <Award className="w-3.5 h-3.5 text-[#C4923A]" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#3D2E1A]">2. Titolo, Aree & Filosofia</h3>
        </div>

        {/* helper: bilingual row */}
        {([
          { label: "Titolo Professionale", itKey: "title_it" as const, enKey: "title_en" as const, itPh: "es. Guida Turistica Autorizzata", enPh: "e.g. Authorized Tour Guide" },
          { label: "Area Operativa", itKey: "operating_area_it" as const, enKey: "operating_area_en" as const, itPh: "es. Veneto e Trentino", enPh: "e.g. Veneto & Trentino" },
          { label: "Claim Slow Tourism", itKey: "slow_tourism_claim_it" as const, enKey: "slow_tourism_claim_en" as const, itPh: "es. Tempo per guardare, non solo vedere", enPh: "e.g. Time to gaze, not just glance" },
        ] as const).map(({ label, itKey, enKey, itPh, enPh }) => (
          <div key={itKey}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-[#7A6655]">{label}</label>
              <TranslateButton sourceText={profile?.[itKey] || ""} onTranslated={(t) => setProfile((p: any) => p ? { ...p, [enKey]: t } : p)} />
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
                <input
                  className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
                  value={profile?.[itKey] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile((p: any) => p ? { ...p, [itKey]: val } : p);
                    triggerAutoTranslate(`p_${itKey}`, val, (t) => setProfile((p: any) => p ? { ...p, [enKey]: t } : p));
                  }}
                  placeholder={itPh}
                />
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
                <input className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none" value={profile?.[enKey] || ""} onChange={(e) => setProfile((p: any) => p ? { ...p, [enKey]: e.target.value } : p)} placeholder={enPh} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Biografia (Breve & Lunga) */}
      <div className="bg-[#F9F4EC] p-4 rounded-sm border border-[#E9DCC4] space-y-3">
        <div className="flex items-center gap-2 border-b border-black/5 pb-2">
          <Type className="w-3.5 h-3.5 text-[#4A6535]" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#3D2E1A]">3. Biografia (Breve & Estesa)</h3>
        </div>

        {/* Bio breve */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-[#7A6655]">Biografia Breve (Hero & Card)</label>
            <TranslateButton sourceText={profile?.bio_short_it || ""} onTranslated={(t) => setProfile((p: any) => p ? { ...p, bio_short_en: t } : p)} />
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT — Italiano</span>
              <textarea
                rows={3}
                className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#9C1C1C] focus:outline-none leading-relaxed"
                value={profile?.bio_short_it || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile((p: any) => p ? { ...p, bio_short_it: val } : p);
                  triggerAutoTranslate("p_bio_short", val, (t) => setProfile((p: any) => p ? { ...p, bio_short_en: t } : p));
                }}
                placeholder="Biografia breve in italiano..."
              />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN — English</span>
              <textarea
                rows={3}
                className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#3D6E90] focus:outline-none leading-relaxed"
                value={profile?.bio_short_en || ""}
                onChange={(e) => setProfile((p: any) => p ? { ...p, bio_short_en: e.target.value } : p)}
                placeholder="Short bio in English..."
              />
            </div>
          </div>
        </div>

        {/* Biografia estesa */}
        <div className="pt-2 border-t border-black/5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-[#7A6655]">Biografia Estesa (Sezione &quot;Chi Sono&quot;)</label>
            <TranslateButton sourceText={profile?.bio_long_it || ""} onTranslated={(t) => setProfile((p: any) => p ? { ...p, bio_long_en: t } : p)} />
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT — Italiano</span>
              <textarea
                rows={5}
                className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#9C1C1C] focus:outline-none leading-relaxed"
                value={profile?.bio_long_it || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile((p: any) => p ? { ...p, bio_long_it: val } : p);
                  triggerAutoTranslate("p_bio_long", val, (t) => setProfile((p: any) => p ? { ...p, bio_long_en: t } : p));
                }}
                placeholder="Biografia approfondita in italiano..."
              />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN — English</span>
              <textarea
                rows={5}
                className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#3D6E90] focus:outline-none leading-relaxed"
                value={profile?.bio_long_en || ""}
                onChange={(e) => setProfile((p: any) => p ? { ...p, bio_long_en: e.target.value } : p)}
                placeholder="Full biography in English..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Contatti Diretti */}
      <div className="bg-[#F9F4EC] p-4 rounded-sm border border-[#E9DCC4] space-y-3">
        <div className="flex items-center justify-between border-b border-black/5 pb-2">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#9C1C1C]" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#3D2E1A]">4. Contatti Diretti</h3>
          </div>
          <button
            type="button"
            onClick={() => setContacts([...contacts, { id: null, type: "email", label_it: "Email", label_en: "Email", value: "", sort_order: contacts.length }])}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C1C1C] hover:underline"
          >
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>

        {contacts.map((c, i) => (
          <div key={c.id || i} className="p-3 bg-white border border-[#E9DCC4] rounded-sm space-y-2">
            {/* Riga 1: tipo + pulsante rimozione */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[9px] font-semibold text-[#7A6655] block mb-0.5">Tipo</label>
                <select
                  className="w-full text-xs p-1.5 bg-[#F9F4EC] border border-[#E9DCC4] rounded-sm"
                  value={c.type || "email"}
                  onChange={(e) => setContacts(contacts.map((x, idx) => idx === i ? { ...x, type: e.target.value } : x))}
                >
                  <option value="email">Email</option>
                  <option value="phone">Telefono</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="pec">PEC</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))}
                className="mt-4 p-1.5 text-[#92816A] hover:text-[#9C1C1C] hover:bg-rose-50 rounded-sm shrink-0"
                title="Rimuovi contatto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Riga 2: etichette IT / EN */}
            <div className="flex gap-1.5">
              <div className="flex-1">
                <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">Etichetta IT</span>
                <input
                  className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm"
                  value={c.label_it || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContacts((curr) => curr.map((x, idx) => idx === i ? { ...x, label_it: val } : x));
                    triggerAutoTranslate(`c_label_${i}`, val, (t) => setContacts((curr) => curr.map((x, idx) => idx === i ? { ...x, label_en: t } : x)));
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold text-[#3D6E90]">Etichetta EN</span>
                  <TranslateButton sourceText={c.label_it || ""} onTranslated={(t) => setContacts(contacts.map((x, idx) => idx === i ? { ...x, label_en: t } : x))} />
                </div>
                <input className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm" value={c.label_en || ""} onChange={(e) => setContacts(contacts.map((x, idx) => idx === i ? { ...x, label_en: e.target.value } : x))} />
              </div>
            </div>
            {/* Riga 3: valore */}
            <div>
              <span className="text-[9px] font-semibold text-[#7A6655] block mb-0.5">Valore (indirizzo, numero o link)</span>
              <input
                className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm font-mono"
                value={c.value || ""}
                onChange={(e) => setContacts(contacts.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                placeholder="es. info@davideapolloni.it"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Credenziali & Riconoscimenti */}
      <div className="bg-[#F9F4EC] p-4 rounded-sm border border-[#E9DCC4] space-y-3">
        <div className="flex items-center justify-between border-b border-black/5 pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#9C1C1C]" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#3D2E1A]">5. Credenziali & Riconoscimenti</h3>
          </div>
          <button
            type="button"
            onClick={() => setCredentials([...credentials, { id: null, title_it: "", title_en: "", description_it: "", description_en: "", sort_order: credentials.length }])}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C1C1C] hover:underline"
          >
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>

        {credentials.map((cr, i) => (
          <div key={cr.id || i} className="p-3 bg-white border border-[#E9DCC4] rounded-sm space-y-2">
            {/* Titoli IT/EN con bottone rimozione */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-semibold text-[#7A6655]">Titolo</span>
                <div className="flex items-center gap-1">
                  <TranslateButton sourceText={cr.title_it || ""} onTranslated={(t) => setCredentials(credentials.map((x, idx) => idx === i ? { ...x, title_en: t } : x))} />
                  <button type="button" onClick={() => setCredentials(credentials.filter((_, idx) => idx !== i))} className="p-1 text-[#92816A] hover:text-[#9C1C1C] hover:bg-rose-50 rounded-sm" title="Rimuovi">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
                  <input
                    className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm"
                    value={cr.title_it || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCredentials((curr) => curr.map((x, idx) => idx === i ? { ...x, title_it: val } : x));
                      triggerAutoTranslate(`cr_title_${i}`, val, (t) => setCredentials((curr) => curr.map((x, idx) => idx === i ? { ...x, title_en: t } : x)));
                    }}
                    placeholder="es. Guida Turistica Abilitata"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
                  <input className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm" value={cr.title_en || ""} onChange={(e) => setCredentials(credentials.map((x, idx) => idx === i ? { ...x, title_en: e.target.value } : x))} placeholder="e.g. Licensed Tour Guide" />
                </div>
              </div>
            </div>
            {/* Descrizioni */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-semibold text-[#7A6655]">Descrizione</span>
                <TranslateButton sourceText={cr.description_it || ""} onTranslated={(t) => setCredentials(credentials.map((x, idx) => idx === i ? { ...x, description_en: t } : x))} />
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
                  <textarea
                    rows={2}
                    className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm resize-y leading-relaxed"
                    value={cr.description_it || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCredentials((curr) => curr.map((x, idx) => idx === i ? { ...x, description_it: val } : x));
                      triggerAutoTranslate(`cr_desc_${i}`, val, (t) => setCredentials((curr) => curr.map((x, idx) => idx === i ? { ...x, description_en: t } : x)));
                    }}
                    placeholder="Dettaglio o matricola albo..."
                  />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
                  <textarea rows={2} className="w-full text-xs p-1.5 bg-white border border-[#E9DCC4] rounded-sm resize-y leading-relaxed" value={cr.description_en || ""} onChange={(e) => setCredentials(credentials.map((x, idx) => idx === i ? { ...x, description_en: e.target.value } : x))} placeholder="Details in English..." />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Picker Modal */}
      {photoPickerOpen && (
        <MediaPickerModal
          value={profile?.photo_url || ""}
          onChange={(url: string) => {
            setProfile({ ...profile, photo_url: url });
            setPhotoPickerOpen(false);
          }}
          onClose={() => setPhotoPickerOpen(false)}
          title="Seleziona Foto Profilo"
        />
      )}
    </div>
  );
}

/* ============================================================
   TAB 3: Curriculum Tab Content (In-Place Inline Edit)
   ============================================================ */
function CvTabContent({
  profileId,
  onSaved,
}: {
  profileId: string | null;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("cv_items") as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditItem({
      id: null,
      section_it: "Formazione & Specializzazioni",
      section_en: "Education & Specializations",
      title_it: "",
      title_en: "",
      institution_it: "",
      institution_en: "",
      period_it: "",
      period_en: "",
      description_it: "",
      description_en: "",
      sort_order: rows.length,
    });
  };

  const onSaveCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    setMsg(null);
    try {
      let validProfileId = profileId || editItem.profile_id;
      if (!validProfileId) {
        const { data: prof } = await (supabase.from("profiles") as any)
          .select("id")
          .limit(1)
          .maybeSingle();
        validProfileId = prof?.id;
      }

      if (!validProfileId) {
        throw new Error("Profilo non trovato nel database");
      }

      const payload = {
        id: editItem.id || crypto.randomUUID(),
        profile_id: validProfileId,
        section_it: editItem.section_it || "Formazione & Specializzazioni",
        section_en: editItem.section_en || editItem.section_it || "Education & Specializations",
        title_it: editItem.title_it,
        title_en: editItem.title_en || editItem.title_it,
        institution_it: editItem.institution_it || null,
        institution_en: editItem.institution_en || null,
        period_it: editItem.period_it || null,
        period_en: editItem.period_en || null,
        description_it: editItem.description_it || null,
        description_en: editItem.description_en || null,
        sort_order: Number(editItem.sort_order ?? 0),
      };

      const { error } = await (supabase.from("cv_items") as any).upsert(payload, {
        onConflict: "id",
      });
      if (error) throw error;
      setMsg({ type: "ok", text: "✓ Voce curriculum salvata con successo" });
      setEditItem(null);
      await load();
      onSaved();
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio CV") });
    } finally {
      setSaving(false);
    }
  };

  const onDeleteCv = async (id: string) => {
    if (!confirm("Eliminare questa voce del curriculum?")) return;
    try {
      const { error } = await (supabase.from("cv_items") as any).delete().eq("id", id);
      if (error) throw error;
      if (editItem?.id === id) setEditItem(null);
      load();
      onSaved();
    } catch (e: any) {
      alert("Errore eliminazione: " + e.message);
    }
  };

  const renderCvForm = (isNew: boolean) => (
    <form
      onSubmit={onSaveCv}
      className="p-4 bg-[#F9F4EC] border-2 border-[#9C1C1C]/40 rounded-sm space-y-3.5 shadow-md my-2"
    >
      <div className="flex items-center justify-between border-b border-black/5 pb-2">
        <p className="font-semibold text-xs text-[#1E160A] flex items-center gap-1.5">
          {isNew ? <Plus className="w-3.5 h-3.5 text-[#9C1C1C]" /> : <Edit2 className="w-3.5 h-3.5 text-[#9C1C1C]" />}
          {isNew ? "Nuova Voce Curriculum" : "Modifica Voce Curriculum"}
        </p>
        <button
          type="button"
          onClick={() => setEditItem(null)}
          className="text-[11px] text-[#7A6655] hover:text-[#1E160A] font-semibold"
        >
          ✕ Chiudi
        </button>
      </div>

      {/* Sezione */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Sezione CV</label>
          <TranslateButton
            sourceText={editItem.section_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, section_en: t } : prev)}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <input
              required
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={editItem.section_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, section_it: val } : prev);
                triggerAutoTranslate("cv_section", val, (t) => setEditItem((prev: any) => prev ? { ...prev, section_en: t } : prev));
              }}
              placeholder="es. Formazione & Specializzazioni"
            />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
              value={editItem.section_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, section_en: e.target.value } : prev)}
              placeholder="e.g. Education & Specializations"
            />
          </div>
        </div>
      </div>

      {/* Titolo / Qualifica */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Titolo / Qualifica *</label>
          <TranslateButton
            sourceText={editItem.title_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, title_en: t } : prev)}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <input
              required
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={editItem.title_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, title_it: val } : prev);
                triggerAutoTranslate("cv_title", val, (t) => setEditItem((prev: any) => prev ? { ...prev, title_en: t } : prev));
              }}
              placeholder="es. Laurea Magistrale in Storia dell'Arte"
            />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
              value={editItem.title_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, title_en: e.target.value } : prev)}
              placeholder="e.g. Master's Degree in Art History"
            />
          </div>
        </div>
      </div>

      {/* Istituzione */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Istituzione / Ente</label>
          <TranslateButton
            sourceText={editItem.institution_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, institution_en: t } : prev)}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={editItem.institution_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, institution_it: val } : prev);
                triggerAutoTranslate("cv_inst", val, (t) => setEditItem((prev: any) => prev ? { ...prev, institution_en: t } : prev));
              }}
              placeholder="es. Università di Padova"
            />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
              value={editItem.institution_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, institution_en: e.target.value } : prev)}
              placeholder="e.g. University of Padua"
            />
          </div>
        </div>
      </div>

      {/* Periodo & Ordine */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-[#7A6655] block mb-1">Periodo / Anno</label>
          <input
            className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none font-mono"
            value={editItem.period_it || ""}
            onChange={(e) =>
              setEditItem((prev: any) =>
                prev
                  ? {
                    ...prev,
                    period_it: e.target.value,
                    period_en: e.target.value,
                  }
                  : prev
              )
            }
            placeholder="es. 2014 – 2019"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-[#7A6655] block mb-1">Ordine visualizzazione</label>
          <input
            type="number"
            className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
            value={editItem.sort_order ?? 0}
            onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, sort_order: Number(e.target.value) } : prev)}
          />
        </div>
      </div>

      {/* Descrizione IT / EN */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Descrizione / Dettagli</label>
          <TranslateButton
            sourceText={editItem.description_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, description_en: t } : prev)}
          />
        </div>
        <div className="space-y-1.5">
          <div>
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <textarea
              rows={2}
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#9C1C1C] focus:outline-none leading-relaxed"
              value={editItem.description_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, description_it: val } : prev);
                triggerAutoTranslate("cv_desc", val, (t) => setEditItem((prev: any) => prev ? { ...prev, description_en: t } : prev));
              }}
              placeholder="Descrizione o dettagli in italiano..."
            />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <textarea
              rows={2}
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#3D6E90] focus:outline-none leading-relaxed"
              value={editItem.description_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, description_en: e.target.value } : prev)}
              placeholder="Description or details in English..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
        <button
          type="button"
          onClick={() => setEditItem(null)}
          className="px-3.5 py-1.5 rounded-sm text-xs font-semibold text-[#5C4C38] hover:bg-[#E9DCC4]"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] disabled:opacity-60 shadow-sm transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salva voce
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#92816A]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#9C1C1C]" />
        Caricamento voci curriculum…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between border-b border-[#E9DCC4] pb-2">
        <div>
          <h2 className="font-serif font-semibold text-[#1E160A] text-sm flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-[#9C1C1C]" />
            Curriculum Vitae & Titoli
          </h2>
          <p className="text-[11px] text-[#7A6655]">{rows.length} voci salvate</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuova voce
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            "text-xs px-3.5 py-2 rounded-sm border flex items-center gap-2 shadow-sm",
            msg.type === "ok"
              ? "bg-[#4A6535]/15 border-[#4A6535]/40 text-[#3A5228]"
              : "bg-[#9C1C1C]/15 border-[#9C1C1C]/40 text-[#9C1C1C]"
          )}
        >
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Se stiamo creando un NUOVO elemento, mostra il form all'inizio */}
      {editItem && !editItem.id && renderCvForm(true)}

      {/* Lista Voci CV con In-Place Edit per elementi esistenti */}
      <div className="divide-y divide-[#F0E8D6] border border-[#E9DCC4] rounded-sm overflow-hidden bg-white shadow-2xs">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#92816A]">
            Nessuna voce salvata. Clicca &quot;Nuova voce&quot; per iniziare.
          </p>
        ) : (
          rows.map((r) => {
            if (editItem?.id === r.id) {
              return (
                <div key={r.id} className="p-2 bg-[#F9F4EC]">
                  {renderCvForm(false)}
                </div>
              );
            }

            return (
              <div
                key={r.id}
                className="p-3.5 flex items-start justify-between gap-3 hover:bg-[#F9F4EC]/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#4A6535]/15 text-[#3A5228] rounded-sm">
                      {r.section_it || "CV"}
                    </span>
                    {r.period_it && (
                      <span className="text-[10px] text-[#92816A] font-mono">
                        {r.period_it}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-xs text-[#1E160A]">{r.title_it}</p>
                  {r.institution_it && (
                    <p className="text-[11px] text-[#7A6655]">{r.institution_it}</p>
                  )}
                  {r.description_it && (
                    <p className="text-[11px] text-[#92816A] line-clamp-1 mt-0.5">{r.description_it}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => setEditItem({ ...r })}
                    className="w-8 h-8 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] flex items-center justify-center transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#9C1C1C]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCv(r.id)}
                    className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 4: FAQ & Info Tab Content (In-Place Inline Edit)
   ============================================================ */
function FaqTabContent({ onSaved }: { onSaved: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("info_items") as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditItem({
      id: null,
      category_it: "Generale",
      category_en: "General",
      title_it: "",
      title_en: "",
      content_it: "",
      content_en: "",
      sort_order: rows.length,
      is_active: true,
    });
  };

  const onSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...editItem,
        id: editItem.id || crypto.randomUUID(),
        sort_order: Number(editItem.sort_order ?? 0),
        is_active: Boolean(editItem.is_active ?? true),
      };
      const { error } = await (supabase.from("info_items") as any).upsert(payload, {
        onConflict: "id",
      });
      if (error) throw error;
      setMsg({ type: "ok", text: "✓ Domanda FAQ salvata con successo" });
      setEditItem(null);
      await load();
      onSaved();
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio FAQ") });
    } finally {
      setSaving(false);
    }
  };

  const onDeleteFaq = async (id: string) => {
    if (!confirm("Eliminare questa FAQ?")) return;
    try {
      const { error } = await (supabase.from("info_items") as any).delete().eq("id", id);
      if (error) throw error;
      if (editItem?.id === id) setEditItem(null);
      load();
      onSaved();
    } catch (e: any) {
      alert("Errore eliminazione: " + e.message);
    }
  };

  const renderFaqForm = (isNew: boolean) => (
    <form
      onSubmit={onSaveFaq}
      className="p-4 bg-[#F9F4EC] border-2 border-[#9C1C1C]/40 rounded-sm space-y-3.5 shadow-md my-2"
    >
      <div className="flex items-center justify-between border-b border-black/5 pb-2">
        <p className="font-semibold text-xs text-[#1E160A] flex items-center gap-1.5">
          {isNew ? <Plus className="w-3.5 h-3.5 text-[#9C1C1C]" /> : <Edit2 className="w-3.5 h-3.5 text-[#9C1C1C]" />}
          {isNew ? "Nuova FAQ" : "Modifica FAQ"}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[#5C4C38] cursor-pointer">
            <input
              type="checkbox"
              checked={editItem.is_active ?? true}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, is_active: e.target.checked } : prev)}
              className="rounded border-[#E9DCC4] text-[#9C1C1C] focus:ring-[#9C1C1C]"
            />
            <span className="text-[11px] font-semibold">Visibile nel sito</span>
          </label>
          <button
            type="button"
            onClick={() => setEditItem(null)}
            className="text-[11px] text-[#7A6655] hover:text-[#1E160A] font-semibold"
          >
            ✕ Chiudi
          </button>
        </div>
      </div>

      {/* Categoria */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Categoria</label>
          <TranslateButton
            sourceText={editItem.category_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, category_en: t } : prev)}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={editItem.category_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, category_it: val } : prev);
                triggerAutoTranslate("faq_cat", val, (t) => setEditItem((prev: any) => prev ? { ...prev, category_en: t } : prev));
              }}
              placeholder="es. Prenotazioni & Tariffe"
            />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
              value={editItem.category_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, category_en: e.target.value } : prev)}
              placeholder="e.g. Bookings & Rates"
            />
          </div>
        </div>
      </div>

      {/* Domanda IT / EN */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Domanda / Titolo *</label>
          <TranslateButton
            sourceText={editItem.title_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, title_en: t } : prev)}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <input
              required
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
              value={editItem.title_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, title_it: val } : prev);
                triggerAutoTranslate("faq_title", val, (t) => setEditItem((prev: any) => prev ? { ...prev, title_en: t } : prev));
              }}
              placeholder="Domanda in italiano…"
            />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <input
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
              value={editItem.title_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, title_en: e.target.value } : prev)}
              placeholder="Question in English…"
            />
          </div>
        </div>
      </div>

      {/* Risposta IT / EN */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-[#7A6655]">Risposta / Spiegazione *</label>
          <TranslateButton
            sourceText={editItem.content_it || ""}
            onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, content_en: t } : prev)}
          />
        </div>
        <div className="space-y-1.5">
          <div>
            <span className="text-[9px] font-bold text-[#9C1C1C] mb-0.5 block">IT</span>
            <textarea
              required
              rows={3}
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#9C1C1C] focus:outline-none leading-relaxed"
              value={editItem.content_it || ""}
              onChange={(e) => {
                const val = e.target.value;
                setEditItem((prev: any) => prev ? { ...prev, content_it: val } : prev);
                triggerAutoTranslate("faq_content", val, (t) => setEditItem((prev: any) => prev ? { ...prev, content_en: t } : prev));
              }}
              placeholder="Risposta in italiano…"
            />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">EN</span>
            <textarea
              rows={3}
              className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm resize-y focus:border-[#3D6E90] focus:outline-none leading-relaxed"
              value={editItem.content_en || ""}
              onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, content_en: e.target.value } : prev)}
              placeholder="Answer in English…"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
        <button
          type="button"
          onClick={() => setEditItem(null)}
          className="px-3.5 py-1.5 rounded-sm text-xs font-semibold text-[#5C4C38] hover:bg-[#E9DCC4]"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] disabled:opacity-60 shadow-sm transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salva FAQ
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#92816A]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#9C1C1C]" />
        Caricamento FAQ…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between border-b border-[#E9DCC4] pb-2">
        <div>
          <h2 className="font-serif font-semibold text-[#1E160A] text-sm flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#9C1C1C]" />
            Informazioni & FAQ
          </h2>
          <p className="text-[11px] text-[#7A6655]">{rows.length} voci salvate</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuova FAQ
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            "text-xs px-3.5 py-2 rounded-sm border flex items-center gap-2 shadow-sm",
            msg.type === "ok"
              ? "bg-[#4A6535]/15 border-[#4A6535]/40 text-[#3A5228]"
              : "bg-[#9C1C1C]/15 border-[#9C1C1C]/40 text-[#9C1C1C]"
          )}
        >
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Se stiamo creando una NUOVA FAQ, mostra il form in alto */}
      {editItem && !editItem.id && renderFaqForm(true)}

      {/* Lista FAQ con In-Place Edit per elementi esistenti */}
      <div className="divide-y divide-[#F0E8D6] border border-[#E9DCC4] rounded-sm overflow-hidden bg-white shadow-2xs">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#92816A]">
            Nessuna FAQ presente. Clicca &quot;Nuova FAQ&quot; per iniziare.
          </p>
        ) : (
          rows.map((r) => {
            if (editItem?.id === r.id) {
              return (
                <div key={r.id} className="p-2 bg-[#F9F4EC]">
                  {renderFaqForm(false)}
                </div>
              );
            }

            return (
              <div
                key={r.id}
                className="p-3.5 flex items-start justify-between gap-3 hover:bg-[#F9F4EC]/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {r.category_it && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#3D6E90]/15 text-[#244D68] rounded-sm">
                        {r.category_it}
                      </span>
                    )}
                    {!r.is_active && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-sm">
                        Nascosta
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-xs text-[#1E160A]">{r.title_it}</p>
                  {r.content_it && (
                    <p className="text-[11px] text-[#7A6655] line-clamp-2 mt-0.5">{r.content_it}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => setEditItem({ ...r })}
                    className="w-8 h-8 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] flex items-center justify-center transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#9C1C1C]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFaq(r.id)}
                    className="w-8 h-8 rounded-sm hover:bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}



/* ============================================================
   TAB 5: Banner (Hero) Tab Content (Redesigned & Auto-Translate)
   ============================================================ */
function BannersTabContent({ onSaved }: { onSaved: () => void }) {
  interface BannerItem {
    id: string;
    text_it: string;
    text_en: string;
    icon: string;
    style: "olive" | "neutral" | "terracotta" | "dark";
  }

  const STYLE_MAP = {
    olive: "bg-olive/10 border border-olive/30 text-olive-dark",
    neutral: "bg-bg-alt/90 border border-black/10 text-text-main",
    terracotta: "bg-terracotta/10 border border-terracotta/30 text-terracotta-dark",
    dark: "bg-bg-dark text-text-white border border-text-white/15",
  };

  const ICON_COLOR_MAP = {
    olive: "text-terracotta",
    neutral: "text-olive-dark",
    terracotta: "text-terracotta",
    dark: "text-terracotta",
  };

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editItem, setEditItem] = useState<BannerItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("ui_strings") as any)
      .select("key, it, en")
      .like("key", "banner.%");

    const map: Record<string, { it: string; en: string }> = {};
    (data || []).forEach((row: any) => {
      map[row.key] = { it: row.it || "", en: row.en || "" };
    });

    const listStr = map["banner.list"]?.it || "1,2";
    const ids = listStr.split(",").map((s) => s.trim()).filter(Boolean);

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

    setBanners(
      loaded.length > 0
        ? loaded
        : [
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
        ]
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveBanners = async (newList: BannerItem[]) => {
    setSaving(true);
    setMsg(null);
    try {
      const now = new Date().toISOString();
      const listStr = newList.map((b) => b.id).join(",");

      const upserts: any[] = [
        {
          key: "banner.list",
          it: listStr,
          en: listStr,
          description: "Elenco banner hero",
          updated_at: now,
        },
      ];

      for (const b of newList) {
        upserts.push({
          key: `banner.${b.id}.text`,
          it: b.text_it,
          en: b.text_en || b.text_it,
          description: `Banner ${b.id} testo`,
          updated_at: now,
        });
        upserts.push({
          key: `banner.${b.id}.icon`,
          it: b.icon,
          en: b.icon,
          description: `Banner ${b.id} icona`,
          updated_at: now,
        });
        upserts.push({
          key: `banner.${b.id}.style`,
          it: b.style,
          en: b.style,
          description: `Banner ${b.id} stile`,
          updated_at: now,
        });
      }

      const { error } = await (supabase.from("ui_strings") as any).upsert(upserts, {
        onConflict: "key",
      });
      if (error) throw error;

      setBanners(newList);
      setEditItem(null);
      setMsg({ type: "ok", text: "✓ Banner salvati con successo" });
      onSaved();
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio") });
    } finally {
      setSaving(false);
    }
  };

  const handleMove = (index: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    saveBanners(copy);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Eliminare questo banner?")) return;
    const filtered = banners.filter((b) => b.id !== id);
    saveBanners(filtered);
  };

  const onSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    let updated: BannerItem[];
    if (isNew) {
      const newId = `b_${Date.now()}`;
      updated = [...banners, { ...editItem, id: newId }];
    } else {
      updated = banners.map((b) => (b.id === editItem.id ? editItem : b));
    }
    saveBanners(updated);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#92816A]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#9C1C1C]" />
        Caricamento banner hero…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between border-b border-[#E9DCC4] pb-2">
        <div>
          <h2 className="font-serif font-semibold text-[#1E160A] text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#9C1C1C]" />
            Banner in Cima (Hero Section)
          </h2>
          <p className="text-[11px] text-[#7A6655]">{banners.length} banner configurati</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditItem({
              id: "",
              text_it: "",
              text_en: "",
              icon: "Sparkles",
              style: "neutral",
            });
            setPickerOpen(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuovo Banner
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            "text-xs px-3.5 py-2 rounded-sm border flex items-center gap-2 shadow-sm",
            msg.type === "ok"
              ? "bg-[#4A6535]/15 border-[#4A6535]/40 text-[#3A5228]"
              : "bg-[#9C1C1C]/15 border-[#9C1C1C]/40 text-[#9C1C1C]"
          )}
        >
          {msg.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Form Inline with Auto-Translation */}
      {editItem && (
        <form
          onSubmit={onSaveForm}
          className="p-4 bg-[#F9F4EC] border-2 border-[#9C1C1C]/30 rounded-sm space-y-4 shadow-sm"
        >
          <p className="font-semibold text-xs text-[#1E160A] flex items-center gap-1.5 border-b border-black/5 pb-2">
            {isNew ? <Plus className="w-3.5 h-3.5 text-[#9C1C1C]" /> : <Edit2 className="w-3.5 h-3.5 text-[#9C1C1C]" />}
            {isNew ? "Aggiungi Banner" : "Modifica Banner"}
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-[#7A6655]">Testo del Banner</label>
              <TranslateButton
                sourceText={editItem.text_it || ""}
                onTranslated={(t) => setEditItem((prev: any) => prev ? { ...prev, text_en: t } : prev)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] font-bold text-[#7A6655] mb-0.5 block">Italiano (IT) *</span>
                <input
                  required
                  className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#9C1C1C] focus:outline-none"
                  value={editItem.text_it}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditItem((prev: any) => prev ? { ...prev, text_it: val } : prev);
                    triggerAutoTranslate("banner_text", val, (t) => setEditItem((prev: any) => prev ? { ...prev, text_en: t } : prev));
                  }}
                  placeholder="es. Slow tourism · tempo per guardare"
                />
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#3D6E90] mb-0.5 block">English (EN)</span>
                <input
                  className="w-full text-xs p-2 bg-white border border-[#E9DCC4] rounded-sm focus:border-[#3D6E90] focus:outline-none"
                  value={editItem.text_en}
                  onChange={(e) => setEditItem((prev: any) => prev ? { ...prev, text_en: e.target.value } : prev)}
                  placeholder="e.g. Slow tourism · time to gaze"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Icon Picker */}
            <div>
              <label className="text-[10px] font-bold uppercase text-[#7A6655] block mb-1">
                Icona
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full py-1.5 px-2 bg-white border border-[#C4B49A] rounded-sm text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    {renderIconByName(editItem.icon, { className: "w-3.5 h-3.5 text-[#9C1C1C]" })}
                    <span className="truncate">{editItem.icon}</span>
                  </div>
                  <span className="text-[10px] text-[#9C1C1C] font-semibold">Cambia ▾</span>
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

            {/* Style */}
            <div>
              <label className="text-[10px] font-bold uppercase text-[#7A6655] block mb-1">
                Stile & Colore
              </label>
              <select
                className="w-full inpt text-xs bg-white py-1.5 border border-[#C4B49A] rounded-sm"
                value={editItem.style}
                onChange={(e) => setEditItem({ ...editItem, style: e.target.value as any })}
              >
                <option value="olive">Verde Foresta (Slow Tourism)</option>
                <option value="neutral">Neutro Pergamena</option>
                <option value="terracotta">Rosso Cremisi</option>
                <option value="dark">Scuro Notturno</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="px-3.5 py-1.5 rounded-sm text-xs font-semibold text-[#5C4C38] hover:bg-[#E9DCC4]"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#9C1C1C] text-white rounded-sm text-xs font-bold hover:bg-[#6E1212] disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salva Banner
            </button>
          </div>
        </form>
      )}

      {/* Lista Banner */}
      <div className="divide-y divide-[#F0E8D6] border border-[#E9DCC4] rounded-sm overflow-hidden bg-white shadow-2xs">
        {banners.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#92816A]">
            Nessun banner configurato. Clicca &quot;Nuovo Banner&quot;.
          </p>
        ) : (
          banners.map((b, index) => (
            <div
              key={b.id}
              className="p-3 flex items-center justify-between gap-2 hover:bg-[#F9F4EC] transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#92816A] w-4">#{index + 1}</span>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold truncate",
                    STYLE_MAP[b.style] || STYLE_MAP.neutral
                  )}
                >
                  {renderIconByName(b.icon, {
                    className: cn("w-3.5 h-3.5 shrink-0", ICON_COLOR_MAP[b.style] || "text-terracotta"),
                  })}
                  <span className="truncate max-w-[200px]">{b.text_it}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="w-6 h-6 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] disabled:opacity-20 flex items-center justify-center transition-colors"
                  title="Sposta su"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={index === banners.length - 1}
                  onClick={() => handleMove(index, "down")}
                  className="w-6 h-6 rounded-sm hover:bg-[#E9DCC4] text-[#5C4C38] disabled:opacity-20 flex items-center justify-center transition-colors"
                  title="Sposta giù"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditItem({ ...b });
                    setPickerOpen(false);
                  }}
                  className="w-6 h-6 rounded-sm hover:bg-[#E9DCC4] text-[#3D2E1A] flex items-center justify-center transition-colors"
                  title="Modifica"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="w-6 h-6 rounded-sm hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 6: Footer Tab Content (Direct Live Management)
   ============================================================ */
function FooterTabContent({ onSaved }: { onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [data, setData] = useState({
    brandName_it: "Prof. Davide Apolloni",
    brandName_en: "Prof. Davide Apolloni",
    badge_it: "Guida Turistica Autorizzata · Veneto & Trentino",
    badge_en: "Licensed Tourist Guide · Veneto & Trentino",
    badge_icon: "Award",
    desc_it: "Itinerari culturali d'eccellenza tra Veneto e Trentino, condotti da un professore di storia dell'arte con 20+ anni di esperienza.",
    desc_en: "Premium cultural itineraries across Veneto & Trentino, led by an Art History professor with 20+ years of experience.",
    location_it: "Veneto & Trentino, Italia",
    location_en: "Veneto & Trentino, Italy",
    location_icon: "MapPin",
    email_it: "guidaturistica@davideapolloni.it",
    email_en: "guidaturistica@davideapolloni.it",
    email_icon: "Mail",
    piva_it: "—",
    piva_en: "—",
    license_it: "Regione Veneto & Prov. Autonoma TN",
    license_en: "Veneto Region & Autonomous Prov. TN",
    copyright_it: "Tutti i diritti riservati.",
    copyright_en: "All rights reserved.",
    nav_icon: "Sparkles",
    legal_icon: "Shield",
  });

  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: rows } = await (supabase.from("ui_strings") as any)
        .select("key, it, en")
        .like("key", "footer.%");

      const map: Record<string, { it: string; en: string }> = {};
      (rows || []).forEach((r: any) => {
        map[r.key] = { it: r.it || "", en: r.en || "" };
      });

      setData((prev) => ({
        brandName_it: map["footer.brand_name"]?.it || prev.brandName_it,
        brandName_en: map["footer.brand_name"]?.en || prev.brandName_en,
        badge_it: map["footer.badge"]?.it || prev.badge_it,
        badge_en: map["footer.badge"]?.en || prev.badge_en,
        badge_icon: map["footer.badge.icon"]?.it || prev.badge_icon,
        desc_it: map["footer.desc"]?.it || prev.desc_it,
        desc_en: map["footer.desc"]?.en || prev.desc_en,
        location_it: map["footer.location"]?.it || prev.location_it,
        location_en: map["footer.location"]?.en || prev.location_en,
        location_icon: map["footer.location.icon"]?.it || prev.location_icon,
        email_it: map["footer.email"]?.it || prev.email_it,
        email_en: map["footer.email"]?.en || prev.email_en,
        email_icon: map["footer.email.icon"]?.it || prev.email_icon,
        piva_it: map["footer.piva"]?.it || prev.piva_it,
        piva_en: map["footer.piva"]?.en || prev.piva_en,
        license_it: map["footer.license"]?.it || prev.license_it,
        license_en: map["footer.license"]?.en || prev.license_en,
        copyright_it: map["footer.copyright"]?.it || prev.copyright_it,
        copyright_en: map["footer.copyright"]?.en || prev.copyright_en,
        nav_icon: map["footer.nav.icon"]?.it || prev.nav_icon,
        legal_icon: map["footer.legal.icon"]?.it || prev.legal_icon,
      }));
    } catch (e: any) {
      console.error("[FooterTab] Error loading footer strings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const now = new Date().toISOString();
      const entries = [
        { key: "footer.brand_name", it: data.brandName_it, en: data.brandName_en, description: "Nome Brand Footer" },
        { key: "footer.badge", it: data.badge_it, en: data.badge_en, description: "Badge / Sottotitolo Footer" },
        { key: "footer.badge.icon", it: data.badge_icon, en: data.badge_icon, description: "Icona Badge Footer" },
        { key: "footer.desc", it: data.desc_it, en: data.desc_en, description: "Descrizione Footer" },
        { key: "footer.location", it: data.location_it, en: data.location_en, description: "Sede / Luogo Footer" },
        { key: "footer.location.icon", it: data.location_icon, en: data.location_icon, description: "Icona Luogo Footer" },
        { key: "footer.email", it: data.email_it, en: data.email_en, description: "Email Footer" },
        { key: "footer.email.icon", it: data.email_icon, en: data.email_icon, description: "Icona Email Footer" },
        { key: "footer.piva", it: data.piva_it, en: data.piva_en, description: "Partita IVA Footer" },
        { key: "footer.license", it: data.license_it, en: data.license_en, description: "Licenza Guida Footer" },
        { key: "footer.copyright", it: data.copyright_it, en: data.copyright_en, description: "Copyright Footer" },
        { key: "footer.nav.icon", it: data.nav_icon, en: data.nav_icon, description: "Icona Navigazione Footer" },
        { key: "footer.legal.icon", it: data.legal_icon, en: data.legal_icon, description: "Icona Legale Footer" },
      ].map((item) => ({ ...item, updated_at: now }));

      const { error } = await (supabase.from("ui_strings") as any).upsert(entries, {
        onConflict: "key",
      });
      if (error) throw error;

      setMsg({ type: "ok", text: "✓ Modifiche al Footer salvate con successo!" });
      onSaved();
    } catch (e: any) {
      setMsg({ type: "err", text: formatDbError(e?.message || "Errore salvataggio footer") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-2 text-[#7A6655]">
        <Loader2 className="w-6 h-6 animate-spin text-[#9C1C1C]" />
        <span className="text-xs font-medium">Caricamento impostazioni footer...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-full">
      <div className="border-b border-[#E9DCC4] pb-3">
        <h2 className="text-sm font-bold text-[#1E160A] flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-[#9C1C1C]" />
          Gestione Contenuti del Footer
        </h2>
        <p className="text-xs text-[#7A6655] mt-0.5">
          Modifica qui tutti i testi, contatti, licenza, copyright e le icone mostrate nel piè di pagina.
        </p>
      </div>

      {msg && (
        <div
          className={cn(
            "p-3 rounded-sm text-xs font-semibold flex items-center gap-2",
            msg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          )}
        >
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : null}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SEZIONE 1: BRAND E QUALIFICA */}
        <div className="bg-[#FAF6F0] p-3.5 rounded-sm border border-[#E9DCC4] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9C1C1C] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            1. Brand &amp; Qualifica
          </h3>

          {/* Nome Brand */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Nome Brand / Titolo</label>
              <TranslateButton
                sourceText={data.brandName_it}
                targetLang="en"
                onTranslated={(en) => setData((d) => ({ ...d, brandName_en: en }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.brandName_it}
                  onChange={(e) => setData({ ...data, brandName_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                  placeholder="Prof. Davide Apolloni"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.brandName_en}
                  onChange={(e) => setData({ ...data, brandName_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                  placeholder="Prof. Davide Apolloni"
                />
              </div>
            </div>
          </div>

          {/* Qualifica / Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Qualifica / Badge Sottotitolo</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIconPicker("badge_icon")}
                  className="inline-flex items-center gap-1 text-[11px] text-[#9C1C1C] hover:underline font-semibold"
                >
                  {renderIconByName(data.badge_icon, { className: "w-3 h-3" })}
                  <span>Icona: {data.badge_icon}</span>
                </button>
                <TranslateButton
                  sourceText={data.badge_it}
                  targetLang="en"
                  onTranslated={(en) => setData((d) => ({ ...d, badge_en: en }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.badge_it}
                  onChange={(e) => setData({ ...data, badge_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.badge_en}
                  onChange={(e) => setData({ ...data, badge_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* Descrizione Breve */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Descrizione Breve</label>
              <TranslateButton
                sourceText={data.desc_it}
                targetLang="en"
                onTranslated={(en) => setData((d) => ({ ...d, desc_en: en }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <textarea
                  rows={3}
                  value={data.desc_it}
                  onChange={(e) => setData({ ...data, desc_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <textarea
                  rows={3}
                  value={data.desc_en}
                  onChange={(e) => setData({ ...data, desc_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEZIONE 2: RECAPITI E CONTATTI */}
        <div className="bg-[#FAF6F0] p-3.5 rounded-sm border border-[#E9DCC4] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9C1C1C] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            2. Contatti &amp; Sede nel Footer
          </h3>

          {/* Luogo / Sede */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Sede Operativa / Luogo</label>
              <button
                type="button"
                onClick={() => setActiveIconPicker("location_icon")}
                className="inline-flex items-center gap-1 text-[11px] text-[#9C1C1C] hover:underline font-semibold"
              >
                {renderIconByName(data.location_icon, { className: "w-3 h-3" })}
                <span>Icona: {data.location_icon}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.location_it}
                  onChange={(e) => setData({ ...data, location_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.location_en}
                  onChange={(e) => setData({ ...data, location_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Email di Riferimento</label>
              <button
                type="button"
                onClick={() => setActiveIconPicker("email_icon")}
                className="inline-flex items-center gap-1 text-[11px] text-[#9C1C1C] hover:underline font-semibold"
              >
                {renderIconByName(data.email_icon, { className: "w-3 h-3" })}
                <span>Icona: {data.email_icon}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.email_it}
                  onChange={(e) => setData({ ...data, email_it: e.target.value, email_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.email_en}
                  onChange={(e) => setData({ ...data, email_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* Partita IVA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D2E1A]">Partita IVA (es. IT12345678901 o —)</label>
            <input
              type="text"
              value={data.piva_it}
              onChange={(e) => setData({ ...data, piva_it: e.target.value, piva_en: e.target.value })}
              className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
              placeholder="—"
            />
          </div>
        </div>

        {/* SEZIONE 3: LEGALE, LICENZA E COPYRIGHT */}
        <div className="bg-[#FAF6F0] p-3.5 rounded-sm border border-[#E9DCC4] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9C1C1C] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            3. Licenza, Copyright &amp; Icone Colonne
          </h3>

          {/* Licenza */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Dicitura Licenza Guida</label>
              <TranslateButton
                sourceText={data.license_it}
                targetLang="en"
                onTranslated={(en) => setData((d) => ({ ...d, license_en: en }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.license_it}
                  onChange={(e) => setData({ ...data, license_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.license_en}
                  onChange={(e) => setData({ ...data, license_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D2E1A]">Testo Copyright</label>
              <TranslateButton
                sourceText={data.copyright_it}
                targetLang="en"
                onTranslated={(en) => setData((d) => ({ ...d, copyright_en: en }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">IT:</span>
                <input
                  type="text"
                  value={data.copyright_it}
                  onChange={(e) => setData({ ...data, copyright_it: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A6655]">EN:</span>
                <input
                  type="text"
                  value={data.copyright_en}
                  onChange={(e) => setData({ ...data, copyright_en: e.target.value })}
                  className="w-full text-xs p-2 rounded-sm border border-[#E9DCC4] bg-white text-[#1E160A] focus:outline-[#9C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* Icone Colonne */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 bg-white rounded-sm border border-[#E9DCC4] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#3D2E1A] block">Colonna Navigazione</span>
                <span className="text-[10px] text-[#7A6655]">Icona intestazione</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveIconPicker("nav_icon")}
                className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#FAF6F0] border border-[#E9DCC4] text-[#9C1C1C] hover:bg-[#E9DCC4] flex items-center gap-1.5 cursor-pointer"
              >
                {renderIconByName(data.nav_icon, { className: "w-3.5 h-3.5" })}
                <span>{data.nav_icon}</span>
              </button>
            </div>

            <div className="p-2.5 bg-white rounded-sm border border-[#E9DCC4] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#3D2E1A] block">Colonna Legale</span>
                <span className="text-[10px] text-[#7A6655]">Icona intestazione</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveIconPicker("legal_icon")}
                className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#FAF6F0] border border-[#E9DCC4] text-[#9C1C1C] hover:bg-[#E9DCC4] flex items-center gap-1.5 cursor-pointer"
              >
                {renderIconByName(data.legal_icon, { className: "w-3.5 h-3.5" })}
                <span>{data.legal_icon}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pulsante Salva Tutto */}
        <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs py-3 border-t border-[#E9DCC4]">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-sm bg-[#9C1C1C] hover:bg-[#7D1616] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvataggio in corso...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche Footer</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Icon Picker Modal */}
      {activeIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-4 shadow-xl max-w-md w-full">
            <IconPicker
              value={(data as any)[activeIconPicker] || "Sparkles"}
              onChange={(iconName: string) => {
                setData((d) => ({ ...d, [activeIconPicker]: iconName }));
                setActiveIconPicker(null);
              }}
              onClose={() => setActiveIconPicker(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
