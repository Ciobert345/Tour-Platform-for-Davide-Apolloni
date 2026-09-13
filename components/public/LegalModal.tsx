"use client";

import React, { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { X, Shield, FileText, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import supabase from "@/lib/supabase/browser";

export type LegalPage = "privacy" | "terms" | "cookies" | null;

interface Props {
  page: LegalPage;
  onClose: () => void;
}

type LegalKey = Exclude<LegalPage, null>;

interface LegalDoc {
  title_it: string;
  title_en: string;
  body_it: string;
  body_en: string;
}

const FALLBACK: Record<LegalKey, { icon: React.ComponentType<{ className?: string }> } & LegalDoc> = {
  privacy: {
    icon: Shield,
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

**Cookie**
Il sito utilizza esclusivamente cookie tecnici necessari al funzionamento. Non vengono utilizzati cookie di profilazione o di tracciamento di terze parti senza esplicito consenso.

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

**Cookies**
This site uses only technical cookies required for operation. No profiling or third-party tracking cookies are used without explicit consent.

**Last updated:** August 2026`,
  },
  terms: {
    icon: FileText,
    title_it: "Termini di Servizio",
    title_en: "Terms of Service",
    body_it: `**Servizi offerti**
Prof. Davide Apolloni offre servizi di guida turistica autorizzata e accompagnamento turistico nelle Regioni Veneto e Provincia Autonoma di Trento, in conformità alle normative vigenti.

**Preventivi e prenotazioni**
I preventivi inviati tramite il modulo online sono indicativi e non costituiscono contratto vincolante. Il contratto si perfeziona con la conferma scritta da parte del titolare e il versamento dell'eventuale acconto concordato.

**Disdetta e rimborso**
Le cancellazioni effettuate entro 48 ore dalla data del tour comportano il rimborso integrale dell'acconto eventualmente versato. Cancellazioni tardive possono essere soggette a penali secondo accordi specifici.

**Responsabilità**
Il professionista non è responsabile per eventi meteorologici, chiusure impreviste di siti, o altre circostanze di forza maggiore che rendano necessaria la modifica o cancellazione del tour.

**Proprietà intellettuale**
I contenuti del presente sito (testi, foto, video) sono di proprietà esclusiva di Davide Apolloni e non possono essere riprodotti senza autorizzazione scritta.

**Legge applicabile**
I presenti termini sono regolati dalla legge italiana. Foro competente: Tribunale di Padova.

**Ultimo aggiornamento:** Agosto 2026`,
    body_en: `**Services Offered**
Prof. Davide Apolloni provides licensed tourist guide and tour leader services in the Veneto Region and the Autonomous Province of Trento, in compliance with applicable regulations.

**Quotes and Bookings**
Quotes submitted via the online form are indicative and do not constitute a binding contract. The contract is formed upon written confirmation by the service provider and payment of any agreed deposit.

**Cancellation and Refund**
Cancellations made more than 48 hours before the tour date are eligible for a full refund of any deposit paid. Late cancellations may be subject to penalties as agreed upon booking.

**Liability**
The professional is not liable for weather events, unexpected site closures, or other force majeure circumstances that necessitate modification or cancellation of the tour.

**Intellectual Property**
All content on this website (texts, photos, videos) is the exclusive property of Davide Apolloni and may not be reproduced without written authorization.

**Governing Law**
These terms are governed by Italian law. Jurisdiction: Court of Padua.

**Last updated:** August 2026`,
  },
  cookies: {
    icon: Cookie,
    title_it: "Cookie Policy",
    title_en: "Cookie Policy",
    body_it: `**Cosa sono i cookie**
I cookie sono piccoli file di testo che i siti web salvano nel browser dell'utente durante la navigazione.

**Cookie utilizzati da questo sito**

*Cookie tecnici (necessari)*
Questi cookie sono indispensabili per il corretto funzionamento del sito e non richiedono consenso. Includono: cookie di sessione per la gestione della lingua, cookie per il corretto rendering delle pagine.

*Cookie analitici (opzionali)*
Questo sito non utilizza al momento servizi di analisi del traffico (es. Google Analytics). In caso di futura implementazione, sarà aggiornata questa policy e richiesto il consenso.

*Cookie di terze parti*
Il sito può incorporare contenuti video di piattaforme esterne (es. YouTube). Tali piattaforme possono impostare cookie propri. Si consiglia di verificare le policy di tali servizi.

**Gestione dei cookie**
Puoi disabilitare i cookie nelle impostazioni del tuo browser. Disabilitare i cookie tecnici potrebbe compromettere la funzionalità del sito.

**Aggiornamenti**
Questa Cookie Policy può essere aggiornata periodicamente. Si consiglia di consultarla regolarmente.

**Ultimo aggiornamento:** Agosto 2026`,
    body_en: `**What Are Cookies**
Cookies are small text files that websites store in your browser during your visit.

**Cookies Used by This Site**

*Technical Cookies (Required)*
These cookies are essential for the website to function properly and do not require consent. They include: session cookies for language management, cookies for correct page rendering.

*Analytics Cookies (Optional)*
This site does not currently use traffic analysis services (e.g. Google Analytics). If implemented in the future, this policy will be updated and consent will be requested.

*Third-Party Cookies*
The site may embed video content from external platforms (e.g. YouTube). Such platforms may set their own cookies. We recommend checking those services' own policies.

**Managing Cookies**
You can disable cookies in your browser settings. Disabling technical cookies may impair site functionality.

**Updates**
This Cookie Policy may be updated periodically. We recommend checking it regularly.

**Last updated:** August 2026`,
  },
};

const LEGAL_KEYS: LegalKey[] = ["privacy", "terms", "cookies"];
const makeKey = (k: LegalKey, field: string) => `legal.${k}.${field}`;

import { renderWithLinks } from "@/lib/renderWithLinks";

// Funzione di rendering identica a quella dell'Admin per garantire WYSIWYG
function renderBody(text: string) {
  return text.trim().split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
      return (
        <h3 key={i} className="font-serif font-bold text-[#1E160A] text-sm mt-5 mb-2 first:mt-0">
          {renderWithLinks(trimmed.slice(2, -2))}
        </h3>
      );
    }
    if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 2) {
      return (
        <p key={i} className="font-semibold text-[#5C4C38] text-sm mb-1.5">
          {renderWithLinks(trimmed.slice(1, -1))}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-[#5C4C38] leading-relaxed mb-2">
        {renderWithLinks(trimmed)}
      </p>
    );
  });
}

export default function LegalModal({ page, onClose }: Props) {
  const { lang } = useLang();
  const it = lang === "it";
  const [loadedDocs, setLoadedDocs] = useState<Record<LegalKey, LegalDoc> | null>(null);
  const [loadTried, setLoadTried] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const allKeys: string[] = [];
        LEGAL_KEYS.forEach((k) => {
          allKeys.push(makeKey(k, "title_it"), makeKey(k, "title_en"));
          allKeys.push(makeKey(k, "body_it"), makeKey(k, "body_en"));
        });

        const { data, error } = await (supabase.from("ui_strings") as any)
          .select("key, it, en")
          .in("key", allKeys);

        if (error || !alive) return;

        const map: Record<string, { it: string; en: string }> = {};
        (data || []).forEach((row: any) => {
          map[row.key] = { it: row.it || "", en: row.en || "" };
        });

        const next: Record<LegalKey, LegalDoc> = {} as any;
        LEGAL_KEYS.forEach((k) => {
          const def = FALLBACK[k];
          const g = (f: string) => map[makeKey(k, f)];
          const pickIt = (f: string, fallback: string) => {
            const v = g(f);
            return v && (v.it || v.en) ? (v.it || v.en) : fallback;
          };
          const pickEn = (f: string, fallback: string) => {
            const v = g(f);
            return v && (v.en || v.it) ? (v.en || v.it) : fallback;
          };
          next[k] = {
            title_it: pickIt("title_it", def.title_it),
            title_en: pickEn("title_en", def.title_en),
            body_it: pickIt("body_it", def.body_it),
            body_en: pickEn("body_en", def.body_en),
          };
        });
        if (alive) setLoadedDocs(next);
      } catch (e) {
        // Silently fall back to hardcoded content
      } finally {
        if (alive) setLoadTried(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (page) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [page]);

  const k = page;
  let content: (LegalDoc & { icon: React.ComponentType<{ className?: string }> }) | null = null;
  if (k) {
    const doc = loadedDocs?.[k] ?? FALLBACK[k];
    content = { ...FALLBACK[k], ...doc };
  }
  const Icon = content?.icon ?? Shield;

  const bodyReady = content && (loadTried || loadedDocs);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[3000] flex items-end sm:items-center justify-center transition-all duration-300",
        page ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!page}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1E160A]/85 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          "relative bg-[#F9F4EC] w-full sm:max-w-2xl sm:rounded-sm shadow-2xl overflow-hidden transition-all duration-350 flex flex-col",
          "max-h-[92vh] sm:max-h-[80vh]",
          page ? "translate-y-0" : "translate-y-8"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E9DCC4] bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#B22A2A]/10 text-[#B22A2A] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B22A2A]">
                {it ? "Informazioni Legali" : "Legal Information"}
              </p>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#1E160A] leading-tight">
                {content ? (it ? content.title_it : content.title_en) : ""}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-[#7A6655] hover:bg-[#E9DCC4] transition-colors shrink-0 cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 bg-[#F9F4EC]">
          {bodyReady && content && renderBody(it ? content.body_it : content.body_en)}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#E9DCC4] bg-white shrink-0 flex items-center justify-between gap-2">
          <p className="text-[10px] sm:text-[11px] text-[#92816A] font-medium truncate">
            {it ? "Davide Apolloni — Guida Turistica Autorizzata" : "Davide Apolloni — Licensed Tourist Guide"}
          </p>
          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-1.5 bg-[#B22A2A] text-white text-xs font-bold rounded-sm hover:bg-[#9C1C1C] transition-colors cursor-pointer shrink-0"
          >
            {it ? "Chiudi" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}