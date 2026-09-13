"use client";

import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import { tFieldStr } from "@/lib/utils";
import { Quote, Sparkles } from "lucide-react";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import type { Database } from "@/types/database.types";

type QuoteT = Database["public"]["Tables"]["quotes"]["Row"] | null;

const FALLBACK = {
  quote_text_it:
    "Una buona guida non ti mostra le cose: ti accompagna a scoprirle, con il passo lento di chi ama ancora guardare.",
  quote_text_en:
    "A good guide doesn't show you things — they walk beside you while you discover them, with the slow pace of someone who still loves to look.",
  author_it: "Sulla strada del racconto",
  author_en: "On the storytelling path",
};

export default function QuoteSection({ quote }: { quote: QuoteT }) {
  const { lang } = useLang();
  const { strings } = useLanguage();
  const quoteIcon = strings["quote.icon"]?.it || "Quote";
  const q = quote ?? (FALLBACK as any);
  const text = tFieldStr(q as any, "quote_text", lang) || FALLBACK.quote_text_it;
  const author =
    (lang === "it" ? (q as any).author_it : (q as any).author_en) ??
    (lang === "it" ? FALLBACK.author_it : FALLBACK.author_en);

  return (
    <section
      className="py-14 sm:py-20 md:py-32 overflow-hidden relative"
      style={{ backgroundColor: "var(--color-terracotta-dark)", color: "var(--text-white)" }}
    >
      {/* Decoro sfondo, stessa palette di ContactsSection */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(222, 197, 165, 0.15), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "var(--color-terracotta)", opacity: 0.15 }}
      />

      <div className="container-app relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg ring-2 ring-[rgba(222,197,165,0.3)]"
            style={{ backgroundColor: "rgba(222, 197, 165, 0.15)", color: "var(--color-stone)" }}
          >
            <EditableIcon
              id="quote.icon"
              iconName={quoteIcon}
              stringKey="quote.icon"
              label="Icona Citazione"
              iconProps={{
                className: "w-6 h-6 sm:w-8 sm:h-8",
                style: { color: "var(--color-stone)", fill: "rgba(222, 197, 165, 0.3)" },
              }}
            />
          </div>
        </div>

        {quote?.id ? (
          <Editable
            id={`quote-text-${quote.id}`}
            label="Citazione Testo"
            kind="quote"
            quoteId={quote.id}
            quoteField="quote_text"
            section="Citazione"
            values={{ it: (quote as any).quote_text_it ?? "", en: (quote as any).quote_text_en ?? "" }}
            as="block"
          >
            <blockquote
              className="font-serif italic text-lg xs:text-xl sm:text-2xl md:text-[2.4rem] leading-relaxed sm:leading-[1.4] mb-6 sm:mb-8 font-light max-w-3xl mx-auto text-balance"
              style={{ color: "var(--text-white)" }}
            >
              “{text}”
            </blockquote>
          </Editable>
        ) : (
          <blockquote
            className="font-serif italic text-lg xs:text-xl sm:text-2xl md:text-[2.4rem] leading-relaxed sm:leading-[1.4] mb-6 sm:mb-8 font-light max-w-3xl mx-auto text-balance"
            style={{ color: "var(--text-white)" }}
          >
            “{text}”
          </blockquote>
        )}

        {author && quote?.id ? (
          <Editable
            id={`quote-author-${quote.id}`}
            label="Citazione Autore"
            kind="quote"
            quoteId={quote.id}
            quoteField="author"
            section="Citazione"
            values={{ it: (quote as any).author_it ?? "", en: (quote as any).author_en ?? "" }}
          >
            <div className="inline-flex items-center gap-3">
              <span className="w-8 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
              <cite
                className="not-italic text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold"
                style={{ color: "var(--color-stone)" }}
              >
                {author}
              </cite>
              <span className="w-8 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
            </div>
          </Editable>
        ) : author ? (
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
            <cite
              className="not-italic text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold"
              style={{ color: "var(--color-stone)" }}
            >
              {author}
            </cite>
            <span className="w-8 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.5)" }} />
          </div>
        ) : null}
      </div>
    </section>
  );
}