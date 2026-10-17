"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import Editable from "@/components/live-edit/Editable";
import { stringValues } from "@/lib/live-edit/helpers";
import { Menu, X, Calendar, Award, Phone, Mail, Compass, Sparkles, BookOpen, MessageSquare, HelpCircle, User, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Header({ fixed = true }: { fixed?: boolean }) {
  const t = useT();
  const { lang, setLang } = useLang();
  const { strings } = useLanguage();
  const pathname = usePathname();
  const anchorPrefix = pathname === "/" ? "" : "/";
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const isClickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mapEnabled = strings["section.hidden.mappa"]?.it !== "true";

  const navItems = [
    { href: "#chi-sono", key: "nav.about", icon: User },
    { href: "#tour", key: "nav.tours", icon: Compass },
    { href: "#esperienze", key: "nav.exclusive", icon: Sparkles },
    { href: "#recensioni", key: "nav.reviews", icon: MessageSquare },
    { href: "#media", key: "nav.media", icon: BookOpen },
    { href: "#info", key: "nav.info", icon: HelpCircle },
    { href: "#contatti", key: "nav.contacts", icon: Phone },
  ];

  const handleLinkClick = () => {};

  const handleNavClick = (id: string, e?: React.MouseEvent) => {
    if (e && !anchorPrefix) {
      e.preventDefault();
    }
    setActiveSection(id);

    if (!anchorPrefix) {
      const el = document.getElementById(id);
      if (el) {
        const offset = 72;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }

    // Blocca il ricalcolo dello scrollspy per evitare che si illuminino i tasti intermedi durante lo scorrimento
    isClickScrollingRef.current = true;
    if (clickScrollTimerRef.current) clearTimeout(clickScrollTimerRef.current);
    clickScrollTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 1100);
  };

  useEffect(() => {
    const sectionIds = ["chi-sono", "tour", "esperienze", "recensioni", "media", "info", "contatti"];

    const handleScrollSpy = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // Se l'utente ha appena cliccato una voce, mantieni quella fissa finché non finisce lo scorrimento
      if (isClickScrollingRef.current) return;

      // Se siamo nella Hero in cima, nessuna sezione interna è attiva
      if (scrollY < 220) {
        setActiveSection("");
        return;
      }

      // Se siamo vicini al fondo della pagina (footer), attiva l'ultima sezione (contatti)
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (windowHeight + scrollY >= docHeight - 80) {
        setActiveSection("contatti");
        return;
      }

      // Regola robusta: trova l'ultima sezione dell'elenco passata oltre l'offset della navbar
      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= 160) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    handleScrollSpy();
    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, []);

  return (
    <>
      {/* ── HEADER PRINCIPALE ── */}
      <header
        className={cn(
          "site-header left-0 w-full z-[1000] transition-all duration-300 ease-out",
          fixed ? "fixed top-0" : "relative",
          "pt-[env(safe-area-inset-top)]",
          scrolled
            ? "bg-[#FAF4EB]/95 dark:bg-[#1a140f]/95 backdrop-blur-md shadow-xs border-b border-black/8 dark:border-white/10 py-2 sm:py-2.5"
            : "bg-[#FAF4EB]/85 dark:bg-[#1f1813]/85 backdrop-blur-xs border-b border-black/5 dark:border-white/8 py-3 sm:py-3.5"
        )}
      >
        <div className="container-app grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:gap-3 min-w-0">

          {/* 1. BRAND / LOGO */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <a
              href={`${anchorPrefix}#hero`}
              className="shrink-0 no-underline"
              aria-label="Davide Apolloni — Home"
              onClick={(e) => {
                if (!anchorPrefix) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
                handleLinkClick();
              }}
            >
              <img
                src={strings["hero.logo_top"]?.it || "/loghi/Guida-Veneto-e-Trentino.png"}
                alt="Davide Apolloni"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-xs border border-terracotta/40 dark:border-gold/40"
              />
            </a>

            <div className="flex flex-col leading-tight min-w-0">
              <a
                href={`${anchorPrefix}#hero`}
                className="font-serif text-base sm:text-lg lg:text-[1.18rem] font-bold text-text-main hover:text-terracotta transition-colors tracking-tight truncate no-underline"
                onClick={handleLinkClick}
              >
                Davide Apolloni
              </a>
              <a
                href="https://portaleprofessioni.ministeroturismo.gov.it/tour-guides/details/17064"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xs:inline-flex text-[9.5px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold text-terracotta dark:text-[#fca59d] items-center gap-1 hover:underline transition-colors truncate"
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
                  <span className="truncate">{t("nav.subtitle")}</span>
                </Editable>
              </a>
            </div>
          </div>

          {/* 2. DESKTOP NAVIGATION — resta nel contenitore, Mappa staccata a destra del gruppo */}
          <nav className="hidden xl:flex items-center justify-center min-w-0 max-w-full">
            <div className="flex items-center min-w-0 max-w-full rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 px-2 h-10">
              <div className="flex items-center gap-0.5 min-w-0">
                {navItems.map((it) => {
                  const id = it.href.replace("#", "");
                  const isActive = activeSection === id;
                  return (
                    <a
                      key={it.href}
                      href={`${anchorPrefix}${it.href}`}
                      onClick={(e) => handleNavClick(id, e)}
                      className={cn(
                        "inline-flex shrink-0 items-center justify-center h-7 px-2.5 text-xs tracking-wide transition-colors duration-200 whitespace-nowrap rounded-full leading-none",
                        isActive
                          ? "text-terracotta dark:text-[#fca59d] font-semibold bg-terracotta/10 dark:bg-terracotta/20"
                          : "font-medium text-text-muted hover:text-terracotta dark:hover:text-[#fca59d]"
                      )}
                    >
                      {t(it.key)}
                    </a>
                  );
                })}
              </div>
              {mapEnabled && (
                <>
                  <span className="mx-1 w-px h-4 bg-black/12 dark:bg-white/15 shrink-0" aria-hidden="true" />
                  <a
                    href="/mappa"
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap no-underline text-terracotta dark:text-[#fca59d] hover:bg-terracotta/10 dark:hover:bg-terracotta/20 transition-colors shrink-0"
                  >
                    <Map className="w-3.5 h-3.5 shrink-0" />
                    {t("nav.map")}
                  </a>
                </>
              )}
            </div>
          </nav>

          {/* 3. RIGHT CONTROLS */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end shrink-0">
            {/* Dock dei controlli utilità (Theme Toggle + Language Switcher raggruppati) */}
            <div className="flex items-center p-1 h-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/8 dark:border-white/10 gap-0.5">
              {/* Theme toggle compatto — cerchio fisso w-8 h-8 */}
              <ThemeToggle variant="icon" className="w-8 h-8 sm:w-8 sm:h-8" />

              {/* Separatore sottile */}
              <span className="w-px h-4 bg-black/10 dark:bg-white/15 mx-0.5" aria-hidden="true" />

              {/* Selettore lingua IT / EN — cerchi fissi w-8 h-8, concentrici col toggle */}
              <button
                type="button"
                aria-label="Italiano"
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors cursor-pointer",
                  lang === "it"
                    ? "bg-terracotta text-white"
                    : "text-text-muted hover:text-text-main dark:hover:text-white"
                )}
                onClick={() => setLang("it")}
              >
                IT
              </button>
              <button
                type="button"
                aria-label="English"
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors cursor-pointer",
                  lang === "en"
                    ? "bg-terracotta text-white"
                    : "text-text-muted hover:text-text-main dark:hover:text-white"
                )}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>

            {/* Pulsante CTA "Prenota una visita" su desktop */}
            <a
              href={`${anchorPrefix}#prenota`}
              onClick={(e) => {
                if (!anchorPrefix) {
                  e.preventDefault();
                  handleNavClick("prenota", e);
                }
              }}
              className="hidden xl:inline-flex items-center justify-center gap-1.5 px-4 h-10 text-xs font-bold uppercase tracking-wider rounded-full bg-terracotta hover:bg-terracotta-dark text-white shadow-xs hover:shadow-md transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <Editable
                id="nav.book"
                label="CTA prenota (header)"
                kind="string"
                stringKey="nav.book"
                section="Header"
                values={stringValues(strings, "nav.book")}
              >
                <span>{t("nav.book")}</span>
              </Editable>
            </a>
          </div>
        </div>
      </header>

      {/* ── 4. NAVBAR MOBILE IN BASSO A PILLOLA (Dock simmetrico, compatto ed elegante) ── */}
      <nav
        aria-label="Navigazione rapida mobile"
        className="xl:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-[min(350px,calc(100%-1.75rem))] pointer-events-auto"
      >
        <div className="h-[54px] flex items-center justify-between bg-[#FAF4EB]/92 dark:bg-[#19130e]/92 backdrop-blur-2xl border border-black/8 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] px-1">
          {/* 1. Chi sono */}
          <a
            href={`${anchorPrefix}#chi-sono`}
            onClick={(e) => handleNavClick("chi-sono", e)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 select-none",
              activeSection === "chi-sono"
                ? "text-terracotta dark:text-[#fca59d] font-bold"
                : "text-text-muted/70 dark:text-[#bda995] hover:text-terracotta dark:hover:text-[#fca59d]"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                activeSection === "chi-sono" ? "bg-terracotta/15 dark:bg-terracotta/25 scale-110" : "bg-transparent"
              )}
            >
              <User className="w-4 h-4" />
            </div>
            <span className="text-[9.5px] leading-none mt-0.5 tracking-tight font-medium">
              {t("nav.mobile.about", lang === "en" ? "About" : "Chi sono")}
            </span>
          </a>

          {/* 2. Tour */}
          <a
            href={`${anchorPrefix}#tour`}
            onClick={(e) => handleNavClick("tour", e)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 select-none",
              activeSection === "tour"
                ? "text-terracotta dark:text-[#fca59d] font-bold"
                : "text-text-muted/70 dark:text-[#bda995] hover:text-terracotta dark:hover:text-[#fca59d]"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                activeSection === "tour" ? "bg-terracotta/15 dark:bg-terracotta/25 scale-110" : "bg-transparent"
              )}
            >
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[9.5px] leading-none mt-0.5 tracking-tight font-medium">
              {t("nav.mobile.tours", lang === "en" ? "Tours" : "Tour")}
            </span>
          </a>

          {/* 3. Esperienze */}
          <a
            href={`${anchorPrefix}#esperienze`}
            onClick={(e) => handleNavClick("esperienze", e)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 select-none",
              activeSection === "esperienze"
                ? "text-terracotta dark:text-[#fca59d] font-bold"
                : "text-text-muted/70 dark:text-[#bda995] hover:text-terracotta dark:hover:text-[#fca59d]"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                activeSection === "esperienze" ? "bg-terracotta/15 dark:bg-terracotta/25 scale-110" : "bg-transparent"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[9.5px] leading-none mt-0.5 tracking-tight font-medium">
              {t("nav.mobile.exclusive", lang === "en" ? "Experiences" : "Esperienze")}
            </span>
          </a>

          {/* 4. Mappa */}
          {mapEnabled && (
            <a
              href="/mappa"
              className={cn(
                "flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 select-none no-underline",
                pathname === "/mappa"
                  ? "text-terracotta dark:text-[#fca59d] font-bold"
                  : "text-text-muted/70 dark:text-[#bda995] hover:text-terracotta dark:hover:text-[#fca59d]"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  pathname === "/mappa" ? "bg-terracotta/15 dark:bg-terracotta/25 scale-110" : "bg-transparent"
                )}
              >
                <Map className="w-4 h-4 text-terracotta dark:text-[#fca59d]" />
              </div>
              <span className="text-[9.5px] leading-none mt-0.5 tracking-tight font-semibold text-terracotta dark:text-[#fca59d]">
                {t("nav.mobile.map", lang === "en" ? "Map" : "Mappa")}
              </span>
            </a>
          )}

          {/* 5. Prenota (Proporzionato esattamente come gli altri, elegante e integrato) */}
          <a
            href={`${anchorPrefix}#prenota`}
            onClick={(e) => handleNavClick("prenota", e)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 select-none",
              activeSection === "prenota"
                ? "text-terracotta dark:text-[#fca59d] font-bold"
                : "text-terracotta/90 dark:text-[#fca59d]/90 hover:text-terracotta"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                activeSection === "prenota"
                  ? "bg-terracotta/15 dark:bg-terracotta/25 scale-110"
                  : "bg-terracotta/8 dark:bg-terracotta/15"
              )}
            >
              <Calendar className="w-4 h-4 text-terracotta dark:text-[#fca59d]" />
            </div>
            <span className="text-[9.5px] leading-none mt-0.5 tracking-tight font-semibold">
              {t("nav.mobile.book", lang === "en" ? "Book" : "Prenota")}
            </span>
          </a>
        </div>
      </nav>
    </>
  );
}