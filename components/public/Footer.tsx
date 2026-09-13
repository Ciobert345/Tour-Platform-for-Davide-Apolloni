"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLang, useLanguage } from "@/lib/i18n/LanguageProvider";
import { stringValues } from "@/lib/live-edit/helpers";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { Award, MapPin, Mail, Shield } from "lucide-react";
import LegalModal, { type LegalPage } from "@/components/public/LegalModal";

export default function Footer() {
  const { lang } = useLang();
  const { strings } = useLanguage();
  const it = lang === "it";
  const [legalPage, setLegalPage] = useState<LegalPage>(null);

  const brandName = strings["footer.brand_name"]?.[lang] || "Prof. Davide Apolloni";
  const badgeText =
    strings["footer.badge"]?.[lang] ||
    (it ? "Guida Turistica Autorizzata · Veneto & Trentino" : "Licensed Tourist Guide · Veneto & Trentino");
  const descText =
    strings["footer.desc"]?.[lang] ||
    (it
      ? "Itinerari culturali d'eccellenza tra Veneto e Trentino, condotti da un professore di storia dell'arte con 20+ anni di esperienza."
      : "Premium cultural itineraries across Veneto & Trentino, led by an Art History professor with 20+ years of experience.");
  const locationText = strings["footer.location"]?.[lang] || "Veneto & Trentino, Italia";
  const emailText = strings["footer.email"]?.[lang] || "guidaturistica@davideapolloni.it";
  const pivaText = strings["footer.piva"]?.[lang] || "—";
  const licenseText =
    strings["footer.license"]?.[lang] ||
    (it ? "Regione Veneto & Prov. Autonoma TN" : "Veneto Region & Autonomous Prov. TN");
  const copyrightText =
    strings["footer.copyright"]?.[lang] || (it ? "Tutti i diritti riservati." : "All rights reserved.");

  return (
    <>
      <footer
        id="footer"
        className="site-footer relative overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--color-terracotta-dark)",
          color: "var(--text-white)",
          borderTop: "1px solid rgba(222, 197, 165, 0.3)",
        }}
      >
        {/* Sfondo decorativo, stessa palette di ContactsSection */}
        <div
          className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
          style={{ backgroundColor: "var(--color-stone)", opacity: 0.15 }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
          style={{ backgroundColor: "var(--color-terracotta)", opacity: 0.15 }}
        />

        {/* Filetto superiore */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(222, 197, 165, 0.7), transparent)",
          }}
        />

        <div className="container-app py-3 xs:py-4 sm:py-8 md:py-12 relative z-10">
          <div className="grid md:grid-cols-[1.35fr_1fr] gap-2 xs:gap-2.5 sm:gap-5 md:gap-12 mb-2 xs:mb-3 sm:mb-5">

            {/* ── Col 1: Brand ── */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 group mb-1 xs:mb-1.5 sm:mb-4 w-fit">

                <div>
                  <Editable
                    id="footer.brand_name"
                    label="Nome Brand (Footer)"
                    kind="string"
                    stringKey="footer.brand_name"
                    section="Footer"
                    values={stringValues(strings, "footer.brand_name", "Prof. Davide Apolloni")}
                  >
                    <p
                      className="font-serif text-sm sm:text-xl leading-tight font-bold tracking-tight transition-colors"
                      style={{ color: "var(--text-white)" }}
                    >
                      {brandName}
                    </p>
                  </Editable>
                  <Editable
                    id="footer.badge"
                    label="Qualifica / Sottotitolo (Footer)"
                    kind="string"
                    stringKey="footer.badge"
                    section="Footer"
                    values={stringValues(
                      strings,
                      "footer.badge",
                      it ? "Guida Turistica Autorizzata · Veneto & Trentino" : "Licensed Tourist Guide · Veneto & Trentino"
                    )}
                  >
                    <div
                      className="text-[8.5px] sm:text-[10px] uppercase tracking-[0.13em] sm:tracking-[0.16em] font-bold flex items-center gap-1 mt-0.5"
                      style={{ color: "var(--color-stone)" }}
                    >
                      <span className="hidden sm:inline-flex">
                        <EditableIcon
                          id="footer.badge.icon"
                          iconName={strings["footer.badge.icon"]?.it || "Award"}
                          stringKey="footer.badge.icon"
                          label="Icona Badge Footer"
                          iconProps={{ className: "w-3 h-3", style: { color: "var(--color-stone)" } }}
                        />
                      </span>
                      {badgeText}
                    </div>
                  </Editable>
                </div>
              </div>

              <Editable
                id="footer.desc"
                label="Descrizione (Footer)"
                kind="string"
                stringKey="footer.desc"
                section="Footer"
                values={stringValues(
                  strings,
                  "footer.desc",
                  it
                    ? "Itinerari culturali d'eccellenza tra Veneto e Trentino, condotti da un professore di storia dell'arte con 20+ anni di esperienza."
                    : "Premium cultural itineraries across Veneto & Trentino, led by an Art History professor with 20+ years of experience."
                )}
                as="block"
              >
                <p
                  className="text-[11px] xs:text-xs sm:text-sm leading-relaxed mb-1.5 xs:mb-2 sm:mb-5 max-w-sm font-light line-clamp-2 xs:line-clamp-3 sm:line-clamp-none"
                  style={{ color: "rgba(247, 240, 227, 0.75)" }}
                >
                  {descText}
                </p>
              </Editable>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md sm:rounded-lg border sm:px-2.5 sm:py-1"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "rgba(222, 197, 165, 0.2)",
                    color: "rgba(247, 240, 227, 0.7)",
                  }}
                >
                  <EditableIcon
                    id="footer.location.icon"
                    iconName={strings["footer.location.icon"]?.it || "MapPin"}
                    stringKey="footer.location.icon"
                    label="Icona Luogo Footer"
                    iconProps={{ className: "w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0", style: { color: "var(--color-stone)" } }}
                  />
                  <Editable
                    id="footer.location"
                    label="Luogo / Città (Footer)"
                    kind="string"
                    stringKey="footer.location"
                    section="Footer"
                    values={stringValues(strings, "footer.location", "Veneto & Trentino, Italia")}
                  >
                    <span>{locationText}</span>
                  </Editable>
                </div>
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md sm:rounded-lg border transition-colors sm:px-2.5 sm:py-1 hover:[border-color:rgba(222,197,165,0.4)] hover:[color:var(--color-stone)]"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderColor: "rgba(222, 197, 165, 0.2)",
                    color: "rgba(247, 240, 227, 0.7)",
                  }}
                >
                  <EditableIcon
                    id="footer.email.icon"
                    iconName={strings["footer.email.icon"]?.it || "Mail"}
                    stringKey="footer.email.icon"
                    label="Icona Email Footer"
                    iconProps={{ className: "w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0", style: { color: "var(--color-stone)" } }}
                  />
                  <Editable
                    id="footer.email"
                    label="Email (Footer)"
                    kind="string"
                    stringKey="footer.email"
                    section="Footer"
                    values={stringValues(strings, "footer.email", "guidaturistica@davideapolloni.it")}
                  >
                    <a href={`mailto:${emailText}`} className="hover:underline">{emailText}</a>
                  </Editable>
                </div>
              </div>
            </div>

            {/* ── Col 2: Legal ── */}
            <div>
              <div
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 xs:mb-2 sm:mb-3.5 flex items-center gap-1.5"
                style={{ color: "var(--color-stone)" }}
              >
                <EditableIcon
                  id="footer.legal.icon"
                  iconName={strings["footer.legal.icon"]?.it || "Shield"}
                  stringKey="footer.legal.icon"
                  label="Icona Colonna Legale Footer"
                  iconProps={{ className: "w-3 h-3", style: { color: "var(--color-stone)" } }}
                />
                {it ? "Info Legali" : "Legal Info"}
              </div>
              <div
                className="rounded-xl p-2 space-y-1 xs:rounded-2xl xs:p-2.5 xs:space-y-1.5 border"
                style={{
                  backgroundColor: "rgba(36, 26, 18, 0.45)",
                  borderColor: "rgba(222, 197, 165, 0.2)",
                }}
              >
                <div
                  className="flex flex-col gap-0.5 pb-1 border-b"
                  style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
                >
                  <span
                    className="text-[9px] sm:text-[9.5px] uppercase tracking-wider font-bold"
                    style={{ color: "rgba(247, 240, 227, 0.45)" }}
                  >
                    {it ? "Partita IVA" : "VAT"}
                  </span>
                  <Editable
                    id="footer.piva"
                    label="Partita IVA (Footer)"
                    kind="string"
                    stringKey="footer.piva"
                    section="Footer"
                    values={stringValues(strings, "footer.piva", "—")}
                  >
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: "rgba(247, 240, 227, 0.85)" }}
                    >
                      {pivaText}
                    </span>
                  </Editable>
                </div>
                <div
                  className="flex flex-col gap-0.5 pb-1 border-b"
                  style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
                >
                  <span
                    className="text-[9px] sm:text-[9.5px] uppercase tracking-wider font-bold"
                    style={{ color: "rgba(247, 240, 227, 0.45)" }}
                  >
                    {it ? "Licenza" : "License"}
                  </span>
                  <Editable
                    id="footer.license"
                    label="Licenza (Footer)"
                    kind="string"
                    stringKey="footer.license"
                    section="Footer"
                    values={stringValues(
                      strings,
                      "footer.license",
                      it ? "Regione Veneto & Prov. Autonoma TN" : "Veneto Region & Autonomous Prov. TN"
                    )}
                  >
                    <span
                      className="text-xs font-semibold leading-tight"
                      style={{ color: "rgba(247, 240, 227, 0.85)" }}
                    >
                      {licenseText}
                    </span>
                  </Editable>
                </div>
                <div className="pt-0.5">
                  <a
                    href="#contatti"
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ color: "var(--color-stone)" }}
                  >
                    {it ? "Contatti diretti" : "Direct contacts"} →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div
            className="pt-2 xs:pt-3 sm:pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 text-[10px] sm:text-xs font-light text-center sm:text-left"
            style={{ borderColor: "rgba(222, 197, 165, 0.2)", color: "rgba(247, 240, 227, 0.45)" }}
          >
            <Editable
              id="footer.copyright"
              label="Testo Copyright (Footer)"
              kind="string"
              stringKey="footer.copyright"
              section="Footer"
              values={stringValues(
                strings,
                "footer.copyright",
                it ? "Tutti i diritti riservati." : "All rights reserved."
              )}
            >
              <p>
                © {new Date().getFullYear()} {brandName} — {copyrightText}
              </p>
            </Editable>
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 xs:gap-x-3 xs:gap-y-1">
              <button
                type="button"
                onClick={() => setLegalPage("privacy")}
                className="transition-colors cursor-pointer hover:[color:var(--color-stone)]"
              >
                Privacy Policy
              </button>
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "rgba(222, 197, 165, 0.3)" }}
              />
              <button
                type="button"
                onClick={() => setLegalPage("terms")}
                className="transition-colors cursor-pointer hover:[color:var(--color-stone)]"
              >
                {it ? "Termini di Servizio" : "Terms of Service"}
              </button>
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "rgba(222, 197, 165, 0.3)" }}
              />
              <button
                type="button"
                onClick={() => setLegalPage("cookies")}
                className="transition-colors cursor-pointer hover:[color:var(--color-stone)]"
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </div>
      </footer >

      {/* Legal modals */}
      < LegalModal page={legalPage} onClose={() => setLegalPage(null)
      } />
    </>
  );
}