"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Loader2,
  Shield,
  FileText,
  Cookie,
  Eye,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Languages,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn, formatDbError } from "@/lib/utils";
import supabase from "@/lib/supabase/browser";
import AdminTutorial from "@/components/admin/AdminTutorial";
import TranslateButton from "@/components/admin/TranslateButton";
import { useToast } from "@/components/admin/ToastProvider";
import { Field, Grid2 } from "@/components/admin/AdminUI";

type LegalKey = "privacy" | "terms" | "cookies";

interface LegalDoc {
  title_it: string;
  title_en: string;
  body_it: string;
  body_en: string;
}

const DOC_META: Record<
  LegalKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    accentBg: string;
    accentText: string;
    badgeClass: string;
    default: LegalDoc;
  }
> = {
  privacy: {
    label: "Privacy Policy",
    icon: Shield,
    accent: "#9C1C1C",
    accentBg: "bg-[#9C1C1C]/10",
    accentText: "text-[#9C1C1C]",
    badgeClass: "bg-[#9C1C1C]/10 text-[#9C1C1C] border-[#9C1C1C]/30",
    default: {
      title_it: "Privacy Policy",
      title_en: "Privacy Policy",
      body_it: `**Titolare del trattamento**
Prof. Davide Apolloni — Guida Turistica Autorizzata
Email: guidaturistica@davideapolloni.it

**Dati raccolti**
Il presente sito raccoglie i dati personali forniti volontariamente tramite il modulo di richiesta preventivo (nome, email, telefono) esclusivamente al fine di rispondere alla richiesta di contatto o preventivo.

**Base giuridica**
Il trattamento è fondato sul consenso dell'interessato (art. 6, par. 1, lett. a del Reg. UE 2016/679 — GDPR).

**Conservazione**
I dati sono conservati per il tempo strettamente necessario a soddisfare la richiesta e non oltre 12 mesi dalla raccolta, salvo diversi obblighi di legge.

**Diritti dell'interessato**
L'interessato ha diritto di accesso, rettifica, cancellazione, limitazione e portabilità dei propri dati, nonché il diritto di revocare il consenso in qualsiasi momento, scrivendo all'indirizzo sopra indicato.

**Ultimo aggiornamento:** Agosto 2026`,
      body_en: `**Data Controller**
Prof. Davide Apolloni — Licensed Tourist Guide
Email: guidaturistica@davideapolloni.it

**Data Collected**
This website collects personal data voluntarily provided through the quote request form (name, email, phone) solely for the purpose of responding to contact or quote requests.

**Legal Basis**
Processing is based on the data subject's consent (Art. 6(1)(a) of EU Regulation 2016/679 — GDPR).

**Retention**
Data is retained for the time strictly necessary to fulfill the request, and no longer than 12 months from collection, unless otherwise required by law.

**Data Subject Rights**
You have the right to access, rectify, erase, restrict, and port your personal data, as well as the right to withdraw consent at any time by writing to the address above.

**Last updated:** August 2026`,
    },
  },
  terms: {
    label: "Termini di Servizio",
    icon: FileText,
    accent: "#3D6E90",
    accentBg: "bg-[#3D6E90]/10",
    accentText: "text-[#3D6E90]",
    badgeClass: "bg-[#3D6E90]/10 text-[#244D68] border-[#3D6E90]/30",
    default: {
      title_it: "Termini di Servizio",
      title_en: "Terms of Service",
      body_it: `**Servizi offerti**
Prof. Davide Apolloni offre servizi di guida turistica autorizzata e accompagnamento turistico nelle Regioni Veneto e Provincia Autonoma di Trento, in conformità alle normative vigenti.

**Preventivi e prenotazioni**
I preventivi inviati tramite il modulo online sono indicativi e non costituiscono contratto vincolante. Il contratto si perfeziona con la conferma scritta da parte del titolare e il versamento dell'eventuale acconto concordato.

**Disdetta e rimborso**
Le cancellazioni effettuate entro 48 ore dalla data del tour comportano il rimborso integrale dell'acconto eventualmente versato. Cancellazioni tardive possono essere soggette a penali secondo accordi specifici.

**Ultimo aggiornamento:** Agosto 2026`,
      body_en: `**Services Offered**
Prof. Davide Apolloni provides licensed tourist guide and tour leader services in the Veneto Region and the Autonomous Province of Trento, in compliance with applicable regulations.

**Quotes and Bookings**
Quotes submitted via the online form are indicative and do not constitute a binding contract. The contract is formed upon written confirmation by the service provider and payment of any agreed deposit.

**Cancellation and Refund**
Cancellations made more than 48 hours before the tour date are eligible for a full refund of any deposit paid. Late cancellations may be subject to penalties as agreed upon booking.

**Last updated:** August 2026`,
    },
  },
  cookies: {
    label: "Cookie Policy",
    icon: Cookie,
    accent: "#4A6535",
    accentBg: "bg-[#4A6535]/10",
    accentText: "text-[#4A6535]",
    badgeClass: "bg-[#4A6535]/10 text-[#3A5228] border-[#4A6535]/30",
    default: {
      title_it: "Cookie Policy",
      title_en: "Cookie Policy",
      body_it: `**Cosa sono i cookie**
I cookie sono piccoli file di testo che i siti web salvano nel browser dell'utente durante la navigazione.

**Cookie utilizzati da questo sito**
*Cookie tecnici (necessari)*
Questi cookie sono indispensabili per il corretto funzionamento del sito e non richiedono consenso. Includono: cookie di sessione per la gestione della lingua, cookie per il corretto rendering delle pagine.

*Cookie analitici (opzionali)*
Questo sito non utilizza al momento servizi di analisi del traffico (es. Google Analytics). In caso di futura implementazione, sarà aggiornata questa policy e richiesto il consenso.

**Ultimo aggiornamento:** Agosto 2026`,
      body_en: `**What Are Cookies**
Cookies are small text files that websites store in your browser during your visit.

**Cookies Used by This Site**
*Technical Cookies (Required)*
These cookies are essential for the website to function properly and do not require consent. They include: session cookies for language management, cookies for correct page rendering.

*Analytics Cookies (Optional)*
This site does not currently use traffic analysis services (e.g. Google Analytics). If implemented in the future, this policy will be updated and consent will be requested.

**Last updated:** August 2026`,
    },
  },
};

import { translateLongText } from "@/lib/translateClient";

const DOC_KEYS: LegalKey[] = ["privacy", "terms", "cookies"];

const makeKeys = (k: LegalKey) => ({
  title_it: `legal.${k}.title_it`,
  title_en: `legal.${k}.title_en`,
  body_it: `legal.${k}.body_it`,
  body_en: `legal.${k}.body_en`,
});

function CollapsibleSection({
  title,
  color,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#E9DCC4] rounded-sm overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#F9F4EC] hover:bg-[#F0E8D6] transition-colors text-left"
      >
        <span className={cn("w-1 h-5 rounded-full shrink-0", color)} />
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-[#3D2E1A]">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[#92816A] shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#92816A] shrink-0" />
        )}
      </button>
      {isOpen && <div className="p-3.5 space-y-3.5 bg-white">{children}</div>}
    </div>
  );
}

function renderBodyPreview(text: string) {
  return text.trim().split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2.5" />;
    if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
      return (
        <h3 key={i} className="font-bold text-[#1E160A] text-sm mt-4 mb-1 first:mt-0">
          {trimmed.slice(2, -2)}
        </h3>
      );
    }
    if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 2) {
      return (
        <p key={i} className="font-semibold text-[#5C4C38] text-sm mb-1">
          {trimmed.slice(1, -1)}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-[#5C4C38] leading-relaxed font-light mb-1">
        {trimmed}
      </p>
    );
  });
}

function AutoTranslateBadge({ state }: { state: "idle" | "loading" | "success" | "error" }) {
  if (state === "idle") return null;
  const map = {
    loading: { cls: "text-blue-adriatic bg-blue-adriatic/10", Icon: Loader2, spin: true, label: "Traduzione automatica in corso…" },
    success: { cls: "text-olive-dark bg-olive-dark/10", Icon: CheckCircle2, spin: false, label: "Tradotto automaticamente ✓" },
    error:   { cls: "text-terracotta bg-terracotta/10", Icon: AlertCircle, spin: false, label: "Traduzione automatica non riuscita" },
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

export default function AdminLegalPage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<LegalKey>("privacy");
  const [previewLang, setPreviewLang] = useState<"it" | "en">("it");

  const [docs, setDocs] = useState<Record<LegalKey, LegalDoc>>({
    privacy: { ...DOC_META.privacy.default },
    terms: { ...DOC_META.terms.default },
    cookies: { ...DOC_META.cookies.default },
  });

  const doc = docs[activeTab];
  const Meta = DOC_META[activeTab];
  const ActiveIcon = Meta.icon;

  // Auto-translate refs & states (one pair per field type, shared across tabs via key prefix)
  const titleTranslateTimer = useRef<NodeJS.Timeout | null>(null);
  const bodyTranslateTimer = useRef<NodeJS.Timeout | null>(null);
  const [titleAutoState, setTitleAutoState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bodyAutoState, setBodyAutoState] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Tiene traccia dell'ultimo testo IT realmente tradotto/visto per ciascun documento.
  const lastSeenTitleIt = useRef<Record<LegalKey, string>>({
    privacy: DOC_META.privacy.default.title_it,
    terms: DOC_META.terms.default.title_it,
    cookies: DOC_META.cookies.default.title_it,
  });
  const lastSeenBodyIt = useRef<Record<LegalKey, string>>({
    privacy: DOC_META.privacy.default.body_it,
    terms: DOC_META.terms.default.body_it,
    cookies: DOC_META.cookies.default.body_it,
  });

  const updateDoc = (key: LegalKey, patch: Partial<LegalDoc>) => {
    setDocs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const allKeys: string[] = [];
      DOC_KEYS.forEach((k) => {
        const ks = makeKeys(k);
        allKeys.push(ks.title_it, ks.title_en, ks.body_it, ks.body_en);
      });

      const { data, error } = await (supabase.from("ui_strings") as any)
        .select("key, it, en")
        .in("key", allKeys);

      if (error) throw error;

      const map: Record<string, { it: string; en: string }> = {};
      (data || []).forEach((row: any) => {
        map[row.key] = { it: row.it || "", en: row.en || "" };
      });

      const next: Record<LegalKey, LegalDoc> = { ...docs };
      DOC_KEYS.forEach((k) => {
        const ks = makeKeys(k);
        const def = DOC_META[k].default;
        const pick = (key: string, fallback: string, prefer: "it" | "en") => {
          const v = map[key];
          if (!v) return fallback;
          const first = prefer === "it" ? v.it : v.en;
          const second = prefer === "it" ? v.en : v.it;
          return (first && first.trim() ? first : second) || fallback;
        };
        next[k] = {
          title_it: pick(ks.title_it, def.title_it, "it"),
          title_en: pick(ks.title_en, def.title_en, "en"),
          body_it: pick(ks.body_it, def.body_it, "it"),
          body_en: pick(ks.body_en, def.body_en, "en"),
        };
      });

      // Allinea la memoria dell'ultimo testo visto a quello appena caricato dal database
      DOC_KEYS.forEach((k) => {
        lastSeenTitleIt.current[k] = next[k].title_it;
        lastSeenBodyIt.current[k] = next[k].body_it;
      });

      setDocs(next);
    } catch (err: any) {
      notify("error", formatDbError(err?.message || "Errore caricamento documenti"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const upserts: any[] = [];

      DOC_KEYS.forEach((k) => {
        const ks = makeKeys(k);
        const d = docs[k];
        upserts.push({ key: ks.title_it, it: d.title_it, en: d.title_it, description: `Legal ${k} title IT`, updated_at: now });
        upserts.push({ key: ks.title_en, it: d.title_en, en: d.title_en, description: `Legal ${k} title EN`, updated_at: now });
        upserts.push({ key: ks.body_it,  it: d.body_it,  en: d.body_it,  description: `Legal ${k} body IT`,  updated_at: now });
        upserts.push({ key: ks.body_en,  it: d.body_en,  en: d.body_en,  description: `Legal ${k} body EN`,  updated_at: now });
      });

      const { error } = await (supabase.from("ui_strings") as any).upsert(upserts, {
        onConflict: "key",
      });

      if (error) throw error;
      notify("success", "Documenti legali salvati e pubblicati sul sito");
    } catch (err: any) {
      notify("error", formatDbError(err?.message || "Errore salvataggio"));
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ✅ AUTO-TRANSLATE: TITOLO (debounce 1.5s)
  // ============================================
  useEffect(() => {
    const it = doc.title_it ?? "";
    if (!it || it.trim().length < 2) return;

    if (lastSeenTitleIt.current[activeTab] === it) return;

    if (titleTranslateTimer.current) clearTimeout(titleTranslateTimer.current);
    titleTranslateTimer.current = setTimeout(async () => {
      lastSeenTitleIt.current[activeTab] = it;
      setTitleAutoState("loading");
      try {
        const translated = await translateLongText(it.trim(), "it", "en");
        updateDoc(activeTab, { title_en: translated });
        setTitleAutoState("success");
        setTimeout(() => setTitleAutoState("idle"), 2500);
      } catch (e) {
        setTitleAutoState("error");
        setTimeout(() => setTitleAutoState("idle"), 3000);
      }
    }, 1500);

    return () => {
      if (titleTranslateTimer.current) clearTimeout(titleTranslateTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.title_it, activeTab]);

  // ============================================
  // ✅ AUTO-TRANSLATE: CORPO (debounce 2.0s — è testo lungo)
  // ============================================
  useEffect(() => {
    const it = doc.body_it ?? "";
    if (!it || it.trim().length < 10) return;

    if (lastSeenBodyIt.current[activeTab] === it) return;

    if (bodyTranslateTimer.current) clearTimeout(bodyTranslateTimer.current);
    bodyTranslateTimer.current = setTimeout(async () => {
      lastSeenBodyIt.current[activeTab] = it;
      setBodyAutoState("loading");
      try {
        const translated = await translateLongText(it.trim(), "it", "en");
        updateDoc(activeTab, { body_en: translated });
        setBodyAutoState("success");
        setTimeout(() => setBodyAutoState("idle"), 2500);
      } catch (e) {
        setBodyAutoState("error");
        setTimeout(() => setBodyAutoState("idle"), 3000);
      }
    }, 2000);

    return () => {
      if (bodyTranslateTimer.current) clearTimeout(bodyTranslateTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.body_it, activeTab]);

  return (
    <div className="space-y-5">
      {/* Header — allineato allo stile delle altre pagine admin (icona + eyebrow, titolo serif, sottotitolo, azione a destra) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[#9C1C1C]">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Documenti Legali</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#1E160A] mt-0.5 leading-tight">
            Privacy, Termini &amp; Cookie Policy
          </h1>
          <p className="text-sm text-[#7A6655] mt-1 max-w-2xl">
            Modifica i documenti mostrati nel footer del sito. I campi italiani si traducono automaticamente in inglese dopo che smetti di scrivere.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#B22A2A] text-white rounded-sm text-sm font-semibold hover:bg-[#9C1C1C] transition-colors shadow-sm disabled:opacity-60 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salva e Pubblica
        </button>
      </div>

      {/* Tutorial */}
      <AdminTutorial
        title="Come funzionano i Documenti Legali"
        description="Scrivi in italiano: titolo e corpo si traducono automaticamente in inglese dopo 1.5/2 secondi dall'ultima digitazione. Pulsante manuale sempre disponibile per forzare."
        badge="Guida Veloce"
        steps={[
          {
            title: "1. Seleziona il documento",
            description: "Usa le schede per passare da Privacy Policy, Termini di Servizio e Cookie Policy.",
            badge: "Schede",
          },
          {
            title: "2. Scrivi in IT, traduzione automatica",
            description: "Compila i campi italiani e attendi 1-2 secondi: la versione inglese si compila da sola (pulsante Traduci sempre disponibile).",
            badge: "Auto · AI",
          },
          {
            title: "3. Anteprima e salva",
            description: "Controlla l'anteprima a destra (switcha IT/EN) e clicca Salva per pubblicare immediatamente sul footer.",
            badge: "Pubblica",
          },
        ]}
        tips={[
          "Sintassi markdown: **Titolo** in grassetto, *Sottotitolo* in corsivo, riga vuota = paragrafo nuovo.",
          "L'auto-traduzione salta se il campo inglese è già stato modificato manualmente.",
          "Se non compili niente viene usato il testo predefinito originale.",
        ]}
        defaultOpen={false}
      />

      {/* Card principale */}
      <div className="bg-white border border-[#E9DCC4] rounded-md shadow-sm overflow-hidden">
        {/* ====== TAB BAR ====== */}
        <div className="border-b border-[#E9DCC4] bg-[#FBF8F2] flex gap-1 px-3 overflow-x-auto">
          {DOC_KEYS.map((k) => {
            const M = DOC_META[k];
            const I = M.icon;
            const active = activeTab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActiveTab(k)}
                style={active ? { color: M.accent } : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold uppercase tracking-wider transition-colors shrink-0",
                  active ? "" : "text-[#92816A] hover:text-[#3D2E1A]"
                )}
              >
                <I className="w-3.5 h-3.5" />
                {M.label}
                {active && (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full"
                    style={{ background: M.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-14 text-center text-xs text-[#92816A]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B22A2A]" />
            Caricamento documenti…
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-0">
            {/* —— SX: Form —— */}
            <div className="lg:col-span-7 p-4 md:p-5 space-y-4 border-r border-[#F0E8D6]">
              {/* Intestazione documento */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E8D6]">
                <div className={cn("w-9 h-9 rounded-sm flex items-center justify-center shrink-0", Meta.accentBg)}>
                  <ActiveIcon className={cn("w-4.5 h-4.5", Meta.accentText)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", Meta.accentText)}>
                    Documento attivo · Footer
                  </p>
                  <h2 className="font-serif text-lg font-bold text-[#1E160A] leading-tight">
                    {Meta.label}
                  </h2>
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 border rounded-sm shrink-0", Meta.badgeClass)}>
                  {activeTab}
                </span>
              </div>

              {/* Titoli */}
              <CollapsibleSection
                title={
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4923A]" />
                    Titoli della modale
                  </span>
                }
                color="bg-[#C4923A]"
                defaultOpen={true}
              >
                <Grid2>
                  <Field
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#E9DCC4] text-[#5C4C38] rounded">IT</span>
                        Titolo Italiano
                      </span>
                    }
                  >
                    <div className="space-y-1.5">
                      {/* Spaziatore invisibile: allinea l'input con quello EN, che ha sopra badge + pulsante Traduci */}
                      <div className="h-7" aria-hidden="true" />
                      <input
                        className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6535]/30 focus:border-[#4A6535] transition-colors"
                        value={doc.title_it}
                        onChange={(e) => updateDoc(activeTab, { title_it: e.target.value })}
                      />
                    </div>
                  </Field>
                  <Field
                    label={
                      <span className="inline-flex items-center justify-between w-full gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#3D6E90]/10 text-[#3D6E90] rounded">EN</span>
                          Title (English)
                        </span>
                      </span>
                    }
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <AutoTranslateBadge state={titleAutoState} />
                        <div className="flex items-center gap-1 ml-auto">
                          <TranslateButton
                            sourceText={doc.title_it}
                            onTranslated={(t) => {
                              lastSeenTitleIt.current[activeTab] = doc.title_it;
                              updateDoc(activeTab, { title_en: t });
                            }}
                            size="sm"
                          />
                        </div>
                      </div>
                      <input
                        className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6535]/30 focus:border-[#4A6535] transition-colors"
                        value={doc.title_en}
                        onChange={(e) => {
                          updateDoc(activeTab, { title_en: e.target.value });
                        }}
                      />
                    </div>
                  </Field>
                </Grid2>
              </CollapsibleSection>

              {/* Corpo */}
              <CollapsibleSection
                title={
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#3D6E90]" />
                    Corpo del documento
                  </span>
                }
                color="bg-[#3D6E90]"
                defaultOpen={true}
              >
                <div className="space-y-3.5">
                  <Field
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#E9DCC4] text-[#5C4C38] rounded">IT</span>
                        Contenuto (Italiano)
                      </span>
                    }
                    hint={
                      <span className="inline-flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 mt-0.5 text-[#C4923A] shrink-0" />
                        <span>
                          <strong>**Titolo**</strong> = grassetto · <strong>*Sottotitolo*</strong> = corsivo · riga vuota = paragrafo.
                        </span>
                      </span>
                    }
                  >
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6535]/30 focus:border-[#4A6535] transition-colors min-h-[200px] font-mono leading-relaxed resize-y"
                      value={doc.body_it}
                      onChange={(e) => updateDoc(activeTab, { body_it: e.target.value })}
                      spellCheck={false}
                    />
                  </Field>

                  <div className="h-px bg-gradient-to-r from-transparent via-[#E9DCC4] to-transparent" />

                  <Field
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#3D6E90]/10 text-[#3D6E90] rounded">EN</span>
                        Content (English)
                        <span className="inline-flex items-center gap-1 text-[#92816A] font-normal normal-case text-[10px] ml-1">
                          <Languages className="w-3 h-3" />
                          auto · 2s dopo l&apos;ultima modifica
                        </span>
                      </span>
                    }
                    hint="Se non vedi il badge, la traduzione automatica è stata saltata perché hai modificato manualmente questo campo."
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <AutoTranslateBadge state={bodyAutoState} />
                        <div className="flex items-center gap-1 ml-auto">
                          <TranslateButton
                            sourceText={doc.body_it}
                            onTranslated={(t) => {
                              lastSeenBodyIt.current[activeTab] = doc.body_it;
                              updateDoc(activeTab, { body_en: t });
                            }}
                            size="md"
                          />
                        </div>
                      </div>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-[#E9DCC4] rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6535]/30 focus:border-[#4A6535] transition-colors min-h-[200px] font-mono leading-relaxed resize-y"
                        value={doc.body_en}
                        onChange={(e) => {
                          updateDoc(activeTab, { body_en: e.target.value });
                        }}
                        spellCheck={false}
                      />
                    </div>
                  </Field>
                </div>
              </CollapsibleSection>
            </div>

            {/* —— DX: Preview —— */}
            <div className="lg:col-span-5 p-4 md:p-5 bg-[#FAF7F1] flex flex-col">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/5 shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6655] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#C4923A]" />
                  Anteprima Modale
                </p>
                <div className="flex gap-1 bg-white border border-[#E9DCC4] p-0.5 rounded-sm">
                  {(["it", "en"] as const).map((L) => (
                    <button
                      key={L}
                      type="button"
                      onClick={() => setPreviewLang(L)}
                      className={cn(
                        "px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors",
                        previewLang === L
                          ? "bg-[#1E160A] text-white"
                          : "text-[#7A6655] hover:bg-[#F9F4EC]"
                      )}
                    >
                      {L === "it" ? "IT" : "EN"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex-1 min-h-0 flex flex-col border-2 border-[#E9DCC4] rounded-xl overflow-hidden shadow-lg bg-[#F9F4EC]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/8 bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", Meta.accentBg)}>
                      <ActiveIcon className={cn("w-4 h-4", Meta.accentText)} />
                    </div>
                    <div>
                      <p className={cn("text-[9px] font-bold uppercase tracking-[0.18em]", Meta.accentText)}>
                        {previewLang === "it" ? "Informazioni Legali" : "Legal Information"}
                      </p>
                      <h3 className="font-serif text-base font-bold text-[#1E160A] leading-tight">
                        {previewLang === "it" ? doc.title_it : doc.title_en}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-[#F9F4EC]">
                  {renderBodyPreview(previewLang === "it" ? doc.body_it : doc.body_en)}
                </div>
                <div className="px-4 py-2.5 border-t border-black/8 bg-white flex items-center justify-between shrink-0">
                  <p className="text-[11px] text-[#92816A] font-light truncate pr-2">
                    {previewLang === "it"
                      ? "Davide Apolloni — Guida Turistica Autorizzata"
                      : "Davide Apolloni — Licensed Tourist Guide"}
                  </p>
                  <span className="px-3.5 py-1.5 bg-[#9C1C1C] text-white text-[11px] font-bold rounded-md shrink-0">
                    {previewLang === "it" ? "Chiudi" : "Close"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}