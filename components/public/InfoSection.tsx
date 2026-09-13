"use client";

import { useState, useMemo } from "react";
import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { stringValues } from "@/lib/live-edit/helpers";
import { tFieldStr } from "@/lib/utils";
import {
  ChevronDown,
  HelpCircle,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Mail,
  Compass,
  Phone,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type InfoT = Database["public"]["Tables"]["info_items"]["Row"];

export default function InfoSection({ items }: { items: InfoT[] }) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();
  const it = lang === "it";

  // Filter out hidden items
  const activeItems = useMemo(
    () => items.filter((it) => (it as any).is_active !== false),
    [items]
  );

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach((it) => {
      const cat = lang === "it" ? (it as any).category_it : (it as any).category_en;
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return Array.from(set);
  }, [activeItems, lang]);

  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Filtered list
  const filteredItems = useMemo(() => {
    if (!selectedCat) return activeItems;
    return activeItems.filter((it) => {
      const cat = lang === "it" ? (it as any).category_it : (it as any).category_en;
      return cat?.trim() === selectedCat;
    });
  }, [activeItems, selectedCat, lang]);

  // Open item state
  const [open, setOpen] = useState<string | null>(activeItems[0]?.id ?? null);

  const badgeText = strings["info.badge"]?.[lang] || (it ? "FAQ & Dettagli Utili" : "FAQ & Useful Details");
  const titleText = strings["info.title"]?.[lang] || (it ? "Domande Frequenti" : "Frequently Asked Questions");
  const descText =
    strings["info.desc"]?.[lang] ||
    (it
      ? "Tutto quello che c'è da sapere per organizzare al meglio la tua visita guidata, dalle modalità di prenotazione alla durata dei percorsi."
      : "Everything you need to know before booking your guided experience, from scheduling to tour specifics.");
  const boxTitle = strings["info.box_title"]?.[lang] || (it ? "Altre domande?" : "Need more info?");
  const boxSubtitle = strings["info.box_subtitle"]?.[lang] || (it ? "Rispondo sempre entro 24 ore." : "I reply within 24 hours.");
  const btnQuoteText = strings["info.box_btn_quote"]?.[lang] || (it ? "Preventivo" : "Get Quote");
  const btnContactText = strings["info.box_btn_contact"]?.[lang] || (it ? "Scrivimi" : "Contact");

  return (
    <section id="info" className="py-7 sm:py-14 md:py-20 scroll-mt-20 bg-[#F9F4EC] border-b border-black/5 relative overflow-hidden">
      {/* Sfondo decorativo delicato */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4923A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9C1C1C]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-app max-w-6xl relative z-10">

        {/* Layout Editoriale a 2 Colonne (Sidebar Sinistra + Accordion Destro) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-start">

          {/* COLONNA SINISTRA: Titolo, Categorie & Contatto Rapido */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 self-start">
            <div>
              <Editable
                id="info.badge"
                label="Badge Sezione FAQ"
                kind="string"
                stringKey="info.badge"
                section="FAQ"
                values={stringValues(strings, "info.badge", it ? "FAQ & Dettagli Utili" : "FAQ & Useful Details")}
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#9C1C1C]/10 text-[#9C1C1C] border border-[#9C1C1C]/20 mb-2 sm:mb-3">
                  <EditableIcon
                    id="info.badge.icon"
                    iconName={strings["info.badge.icon"]?.it || "Compass"}
                    stringKey="info.badge.icon"
                    label="Icona Badge FAQ"
                    iconProps={{ className: "w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#9C1C1C]" }}
                  />
                  {badgeText}
                </span>
              </Editable>

              <Editable
                id="info.title"
                label="Titolo Principale FAQ"
                kind="string"
                stringKey="info.title"
                section="FAQ"
                values={stringValues(strings, "info.title", it ? "Domande Frequenti" : "Frequently Asked Questions")}
                as="block"
              >
                <h2 className="font-serif text-xl xs:text-2xl sm:text-4xl font-bold text-[#1E160A] tracking-tight leading-tight">
                  {titleText}
                </h2>
              </Editable>

              <Editable
                id="info.desc"
                label="Descrizione Sezione FAQ"
                kind="string"
                stringKey="info.desc"
                section="FAQ"
                values={stringValues(
                  strings,
                  "info.desc",
                  it
                    ? "Tutto quello che c'è da sapere per organizzare al meglio la tua visita guidata, dalle modalità di prenotazione alla durata dei percorsi."
                    : "Everything you need to know before booking your guided experience, from scheduling to tour specifics."
                )}
                as="block"
              >
                <p className="text-xs sm:text-sm text-[#7A6655] font-light leading-relaxed mt-1.5 sm:mt-2.5">
                  {descText}
                </p>
              </Editable>
            </div>

            {/* Box Assistenza & Contatto Rapido */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E9DCC4] shadow-xs space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#C4923A]/15 text-[#C4923A] flex items-center justify-center shrink-0">
                  <EditableIcon
                    id="info.box.icon"
                    iconName={strings["info.box.icon"]?.it || "MessageCircle"}
                    stringKey="info.box.icon"
                    label="Icona Box Assistenza (FAQ)"
                    iconProps={{ className: "w-4 h-4" }}
                  />
                </div>
                <div>
                  <Editable
                    id="info.box_title"
                    label="Titolo Box Assistenza (FAQ)"
                    kind="string"
                    stringKey="info.box_title"
                    section="FAQ"
                    values={stringValues(strings, "info.box_title", it ? "Altre domande?" : "Need more info?")}
                  >
                    <p className="font-serif text-sm font-bold text-[#1E160A] leading-tight">
                      {boxTitle}
                    </p>
                  </Editable>
                  <Editable
                    id="info.box_subtitle"
                    label="Sottotitolo Box Assistenza (FAQ)"
                    kind="string"
                    stringKey="info.box_subtitle"
                    section="FAQ"
                    values={stringValues(
                      strings,
                      "info.box_subtitle",
                      it ? "Rispondo sempre entro 24 ore." : "I reply within 24 hours."
                    )}
                  >
                    <p className="text-[11px] text-[#7A6655] font-light">
                      {boxSubtitle}
                    </p>
                  </Editable>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Editable
                  id="info.box_btn_quote"
                  label="Pulsante Preventivo (FAQ)"
                  kind="string"
                  stringKey="info.box_btn_quote"
                  section="FAQ"
                  values={stringValues(strings, "info.box_btn_quote", it ? "Preventivo" : "Get Quote")}
                >
                  <a
                    href="#prenota"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#9C1C1C] text-white rounded-2xl text-[11px] font-bold hover:bg-[#6E1212] transition-colors shadow-xs"
                  >
                    {btnQuoteText}
                    <EditableIcon
                      id="info.box_btn_quote.icon"
                      iconName={strings["info.box_btn_quote.icon"]?.it || "ArrowRight"}
                      stringKey="info.box_btn_quote.icon"
                      label="Icona Pulsante Preventivo (FAQ)"
                      iconProps={{ className: "w-3 h-3" }}
                    />
                  </a>
                </Editable>
                <Editable
                  id="info.box_btn_contact"
                  label="Pulsante Contatto (FAQ)"
                  kind="string"
                  stringKey="info.box_btn_contact"
                  section="FAQ"
                  values={stringValues(strings, "info.box_btn_contact", it ? "Scrivimi" : "Contact")}
                >
                  <a
                    href="#contatti"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-[#C4B49A] text-[#5C4C38] hover:bg-[#E9DCC4]/50 rounded-2xl text-[11px] font-semibold transition-colors"
                  >
                    <EditableIcon
                      id="info.box_btn_contact.icon"
                      iconName={strings["info.box_btn_contact.icon"]?.it || "Mail"}
                      stringKey="info.box_btn_contact.icon"
                      label="Icona Pulsante Contatto (FAQ)"
                      iconProps={{ className: "w-3 h-3 text-[#9C1C1C]" }}
                    />
                    {btnContactText}
                  </a>
                </Editable>
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: Accordion Editoriale Elegante */}
          <div className="lg:col-span-8">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A6655] border border-dashed border-[#E9DCC4] rounded-2xl bg-white p-8">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-[#9C1C1C]/40" />
                <p className="font-light">{t("info.empty")}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E9DCC4] divide-y divide-[#E9DCC4]/70 shadow-xs overflow-hidden">
                {filteredItems.map((it, idx) => {
                  const q = tFieldStr(it as any, "title", lang);
                  const a = tFieldStr(it as any, "content", lang);
                  const cat = lang === "it" ? (it as any).category_it : (it as any).category_en;
                  const isOpen = open === it.id;

                  return (
                    <div
                      key={it.id}
                      className={cn(
                        "transition-colors duration-200",
                        isOpen ? "bg-[#FDFBF7]" : "hover:bg-[#FDFBF7]/50"
                      )}
                    >
                      {/* Bottone Domanda */}
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : it.id)}
                        className="w-full flex items-start sm:items-center justify-between gap-2.5 sm:gap-4 p-2.5 sm:p-5 text-left group cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                          {/* Indice Elegante */}
                          <span
                            className={cn(
                              "font-serif text-xs sm:text-base font-bold shrink-0 w-5 sm:w-6 transition-colors mt-0.5 sm:mt-0",
                              isOpen ? "text-[#9C1C1C]" : "text-[#C4923A]"
                            )}
                          >
                            {String(idx + 1).padStart(2, "0")}.
                          </span>

                          <div className="flex-1 min-w-0">
                            {cat && (
                              <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-[#3D6E90] mb-0.5 block">
                                {cat}
                              </span>
                            )}
                            <Editable
                              id={`faq-q-${it.id}`}
                              label={`Domanda FAQ: ${it.title_it || it.title_en || "Domanda"}`}
                              kind="info_item"
                              infoItemId={it.id}
                              infoField="title"
                              section="Info & FAQ"
                              values={{ it: it.title_it ?? "", en: it.title_en ?? "" }}
                              as="block"
                              className="min-w-0"
                            >
                              <h3
                                className={cn(
                                  "font-serif text-sm sm:text-[1.12rem] font-bold leading-snug transition-colors",
                                  isOpen ? "text-[#9C1C1C]" : "text-[#1E160A] group-hover:text-[#9C1C1C]"
                                )}
                              >
                                {q}
                              </h3>
                            </Editable>
                          </div>
                        </div>

                        {/* Indicatore Chevron circolare */}
                        <div
                          className={cn(
                            "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 sm:mt-0",
                            isOpen
                              ? "bg-[#9C1C1C] border-[#9C1C1C] text-white rotate-180"
                              : "border-[#E9DCC4] text-[#92816A] group-hover:border-[#C4923A] group-hover:text-[#1E160A]"
                          )}
                        >
                          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                      </button>

                      {/* Risposta Espansa */}
                      <div
                        className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-3 pb-3 pt-0 pl-8 sm:pl-15 sm:px-5 sm:pb-5 text-xs sm:text-[0.92rem] text-[#5C4C38] leading-relaxed font-light border-t border-black/5 bg-[#F9F4EC]/40">
                            <Editable
                              id={`faq-a-${it.id}`}
                              label={`Risposta FAQ: ${it.title_it || it.title_en || "Risposta"}`}
                              kind="info_item"
                              infoItemId={it.id}
                              infoField="content"
                              section="Info & FAQ"
                              values={{ it: it.content_it ?? "", en: it.content_en ?? "" }}
                              as="block"
                            >
                              <p className="whitespace-pre-line pt-2 sm:pt-3">
                                {a}
                              </p>
                            </Editable>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
