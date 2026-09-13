"use client";

import React, { useEffect } from "react";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import { tFieldStr } from "@/lib/utils";
import { X, GraduationCap, Briefcase, BookOpen, Award } from "lucide-react";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type CvItemT = Database["public"]["Tables"]["cv_items"]["Row"];

const SECTION_ICONS: Record<number, React.ElementType> = {
  0: GraduationCap,
  1: Briefcase,
  2: BookOpen,
};

export default function CvModal({ cvItems }: { cvItems: CvItemT[] }) {
  const { lang } = useLang();
  const [open, setOpen] = React.useState(false);
  const it = lang === "it";

  // ── Event-based open/close ──────────────────────────────────────────────
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("open-cv-modal", onOpen);
    window.addEventListener("close-cv-modal", onClose);
    document.addEventListener("keydown", onKey);
    if (typeof window !== "undefined") {
      (window as any).openCvModal = () => setOpen(true);
    }
    return () => {
      window.removeEventListener("open-cv-modal", onOpen);
      window.removeEventListener("close-cv-modal", onClose);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Fallback data ───────────────────────────────────────────────────────
  const fallback: { section_it: string; section_en: string; items: any[] }[] = [
    {
      section_it: "Formazione & Specializzazioni",
      section_en: "Education & Specializations",
      items: [
        mkFb("Laurea in Lettere (indirizzo storico-artistico)", "Degree in Literature (Art History)", "Università degli Studi di Padova", "University of Padua", ""),
        mkFb("Specializzazione in Storia dell'Arte Moderna", "Postgraduate Specialization in Modern Art History", "Scuola di Specializzazione dell'Università di Padova", "Specialisation School, University of Padua", ""),
        mkFb("Due Master annuali in Letteratura Italiana e Età Moderna e Contemporanea", "Two Masters in Italian Literature and Modern History", "", "", ""),
        mkFb("Abilitazioni all'Insegnamento", "Teaching Credentials", "Università di Bolzano e Udine", "Free University of Bozen-Bolzano and Udine", ""),
        mkFb("Corso di Specializzazione «I Luoghi della Grande Guerra»", "Specialized Course «Sites of the Great War»", "Asiago, patrocinio Regione Veneto", "Asiago, Veneto Region patronage", "2014"),
      ],
    },
    {
      section_it: "Esperienze e Collaborazioni Culturali",
      section_en: "Cultural Experience & Collaborations",
      items: [
        mkFb("Gabinetto di Disegni e Stampe", "Cabinet of Prints and Drawings", "Museo Castelvecchio di Verona", "Castelvecchio Museum, Verona", ""),
        mkFb("Istituto di Storia dell'Arte", "Institute of Art History", "Fondazione Giorgio Cini di Venezia", "Giorgio Cini Foundation, Venice", ""),
        mkFb("Collaborazioni culturali", "Cultural Collaborations", "Istituto Veneto di Scienze ed École du Louvre di Parigi", "Istituto Veneto di Scienze and École du Louvre, Paris", ""),
        mkFb("Guida storica sul battello «Il Burchiello»", "Historical guide aboard «Il Burchiello»", "Riviera del Brenta", "Brenta Riviera", ""),
        mkFb("Formatore docenti e Autore", "Teacher Trainer and Author", "Rizzoli Education ed Erickson", "Rizzoli Education and Erickson", ""),
      ],
    },
    {
      section_it: "Principali Pubblicazioni & Volumi",
      section_en: "Main Publications & Books",
      items: [],
    },
  ];

  // ── Group CV items by section ──────────────────────────────────────────
  const hasData = cvItems.length > 0;
  const grouped: { name: string; items: any[] }[] = hasData
    ? Object.entries(
        cvItems.reduce<Record<string, CvItemT[]>>((acc, it) => {
          const key = (lang === "it" ? it.section_it : it.section_en) || "—";
          (acc[key] = acc[key] || []).push(it);
          return acc;
        }, {})
      ).map(([name, items]) => ({
        name,
        items: [...items].sort((a, b) => a.sort_order - b.sort_order),
      }))
    : fallback.map((sec) => ({
        name: it ? sec.section_it : sec.section_en,
        items: sec.items,
      }));

  return (
    <div
      className={cn(
        "fixed inset-0 z-[2000] flex items-center justify-center p-2.5 xs:p-4 sm:p-8 transition-all duration-300",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E160A]/85 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col transition-all duration-300",
          open ? "translate-y-0 scale-100" : "translate-y-6 scale-[0.98]"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-black/8 bg-[#F9F4EC] shrink-0">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#9C1C1C] mb-0.5">
              {it ? "Curriculum Vitae Accademico & Professionale" : "Academic & Professional Curriculum Vitae"}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#1E160A] leading-tight">
              Prof. Davide Apolloni
            </h2>
          </div>
          <button
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#9C1C1C] hover:bg-[#E9DCC4] transition-colors shrink-0 cursor-pointer"
            onClick={() => setOpen(false)}
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8">
          {grouped.map((g, gi) => {
            const SectionIcon = SECTION_ICONS[gi] ?? Award;
            return (
              <section key={`${g.name}-${gi}`}>
                {/* Section title */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#9C1C1C]/10 text-[#9C1C1C] flex items-center justify-center shrink-0">
                    <SectionIcon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E160A]">
                    {g.name}
                  </h3>
                </div>

                {g.items.length === 0 ? (
                  <p className="text-sm text-[#92816A] italic font-light pl-9">
                    {it ? "Sezione in aggiornamento..." : "Section coming soon..."}
                  </p>
                ) : (
                  <ul className="space-y-3 pl-9 border-l-2 border-[#E9DCC4]">
                    {g.items.map((item, i) => {
                      const title = tFieldStr(item, "title", lang);
                      const inst  = tFieldStr(item, "institution", lang);
                      const period = tFieldStr(item, "period", lang);
                      const desc  = tFieldStr(item, "description", lang);
                      return (
                        <li key={item.id ?? `fb-${gi}-${i}`} className="relative pl-4">
                          {/* Timeline dot */}
                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#C4923A] border-2 border-white shrink-0" />
                          <p className="font-semibold text-[#1E160A] text-sm leading-snug">{title}</p>
                          {(inst || period) && (
                            <p className="text-xs text-[#9C1C1C]/80 font-medium mt-0.5">
                              {[inst, period].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {desc && (
                            <p className="text-xs text-[#7A6655] font-light leading-relaxed mt-0.5">{desc}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer bar */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-black/8 bg-[#F9F4EC] flex items-center justify-between gap-2 shrink-0">
          <p className="text-[10px] sm:text-[11px] text-[#92816A] font-light truncate">
            {it ? "Guida Turistica Autorizzata — Regione Veneto & Prov. TN" : "Licensed Tourist Guide — Veneto Region & Prov. TN"}
          </p>

        </div>
      </div>
    </div>
  );
}

function mkFb(
  title_it: string, title_en: string,
  institution_it: string, institution_en: string,
  period: string
) {
  return {
    id: Math.random().toString(36).slice(2),
    profile_id: "",
    section_it: "", section_en: "",
    title_it, title_en,
    institution_it, institution_en,
    period_it: period || null,
    period_en: period || null,
    description_it: null, description_en: null,
    sort_order: 0,
    created_at: "",
  };
}

export function openCvModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cv-modal"));
  }
}
