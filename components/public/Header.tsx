"use client";

import React, { useEffect, useState } from "react";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import Editable from "@/components/live-edit/Editable";
import { stringValues } from "@/lib/live-edit/helpers";
import { Menu, X, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  const { strings } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const navItems = [
    { href: "#chi-sono", key: "nav.about" },
    { href: "#tour", key: "nav.tours" },
    { href: "#esperienze", key: "nav.exclusive" },
    { href: "#media", key: "nav.media" },
    { href: "#recensioni", key: "nav.reviews" },
    { href: "#info", key: "nav.info" },
    { href: "#contatti", key: "nav.contacts" },
  ];

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "site-header fixed top-0 left-0 w-full z-[1000] transition-all duration-300 ease-out",
          "pt-[env(safe-area-inset-top)]",
          scrolled
            ? "bg-[#F9F4EC]/95 backdrop-blur-md shadow-xs border-b border-black/8 py-2"
            : "bg-[#F9F4EC]/90 backdrop-blur-xs border-b border-black/5 py-2.5 sm:py-3"
        )}
      >
        <div className="container-app flex items-center justify-between gap-2 min-w-0">
          {/* Brand / Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="#hero"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark text-text-white flex items-center justify-center font-serif text-base font-bold shadow-xs ring-2 ring-gold/40 transition-shadow duration-300 shrink-0 no-underline"
              aria-label="Davide Apolloni — Home"
              onClick={handleLinkClick}
            >
              DA
            </a>
            <div className="flex flex-col leading-tight">
              <a
                href="#hero"
                className="font-serif text-base sm:text-lg lg:text-xl font-bold text-text-main hover:text-terracotta transition-colors tracking-tight whitespace-nowrap no-underline"
                onClick={handleLinkClick}
              >
                Davide Apolloni
              </a>
              <a
                href="https://portaleprofessioni.ministeroturismo.gov.it/tour-guides/details/17064"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex text-[10px] uppercase tracking-[0.14em] font-semibold text-terracotta items-center gap-1 hover:underline hover:text-terracotta-dark transition-colors"
              >
                <Award className="w-3 h-3 text-gold shrink-0 inline" />
                <Editable
                  id="nav.subtitle"
                  label="Sottotitolo header"
                  kind="string"
                  stringKey="nav.subtitle"
                  section="Header"
                  values={stringValues(strings, "nav.subtitle")}
                >
                  {t("nav.subtitle")}
                </Editable>
              </a>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="px-2.5 py-1.5 text-xs xl:text-[0.84rem] font-bold uppercase tracking-wider text-text-muted hover:text-terracotta transition-colors duration-200 relative group/link whitespace-nowrap"
              >
                {t(it.key)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-terracotta group-hover/link:w-3/5 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center bg-[#E9DCC4]/80 p-0.5 rounded-full border border-black/10 shadow-xs">
              <button
                type="button"
                aria-label="Italiano"
                className={cn(
                  "px-2 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all duration-200 cursor-pointer",
                  lang === "it"
                    ? "bg-terracotta text-text-white shadow-xs"
                    : "text-text-muted hover:text-text-main"
                )}
                onClick={() => setLang("it")}
              >
                IT
              </button>
              <button
                type="button"
                aria-label="English"
                className={cn(
                  "px-2 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all duration-200 cursor-pointer",
                  lang === "en"
                    ? "bg-terracotta text-text-white shadow-xs"
                    : "text-text-muted hover:text-text-main"
                )}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>

            <a
              href="#prenota"
              className="btn btn-primary px-3 py-2 text-xs uppercase tracking-wider font-bold rounded-full hidden lg:inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <Editable
                id="nav.book"
                label="CTA prenota (header)"
                kind="string"
                stringKey="nav.book"
                section="Header"
                values={stringValues(strings, "nav.book")}
              >
                {t("nav.book")}
              </Editable>
            </a>

            <button
              className="lg:hidden w-10 h-10 rounded-md flex items-center justify-center hover:bg-black/5 text-text-main transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-6 h-6 text-terracotta" />
              ) : (
                <Menu className="w-6 h-6 text-text-main" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile: tendina dall'alto */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
            menuOpen ? "max-h-[min(80vh,640px)] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
          aria-hidden={!menuOpen}
        >
          <nav className="border-t border-black/8 bg-[#F9F4EC]/98 backdrop-blur-md">
            <div className="container-app py-3 overflow-y-auto max-h-[min(70vh,560px)]">
              {navItems.map((it) => (
                <a
                  key={it.href}
                  href={it.href}
                  onClick={handleLinkClick}
                  className="block px-2 py-3 text-base font-medium rounded-md hover:bg-terracotta/10 hover:text-terracotta text-text-main transition-colors"
                >
                  {t(it.key)}
                </a>
              ))}
              <a
                href="#prenota"
                onClick={handleLinkClick}
                className="btn btn-primary w-full justify-center rounded-full text-xs font-bold uppercase tracking-wider py-3.5 mt-3 mb-2"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                {t("nav.book")}
              </a>
            </div>
          </nav>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-[999] bg-bg-dark/40 backdrop-blur-xs"
          aria-label="Chiudi menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}