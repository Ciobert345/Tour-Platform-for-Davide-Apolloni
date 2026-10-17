"use client";

import { useEffect } from "react";

/**
 * Assicura che al ricaricamento (F5 / reload) della pagina l'utente
 * si trovi sempre all'inizio del sito (Hero) e non posizionato su una
 * sezione precedente come #chi-sono.
 * Non interferisce MAI con la navigazione verso sezioni specifiche (es. #tour dalla mappa).
 */
export default function ScrollToTopOnReload() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Se l'URL punta a #tour o c'è un tour in sessionStorage o query, non forzare top
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    let hasTourHighlight = false;
    try {
      hasTourHighlight = typeof window !== "undefined" && !!sessionStorage.getItem("highlight_tour");
    } catch {}

    if (hash === "#tour" || hasTourHighlight || search.includes("tour=") || search.includes("select=")) {
      return;
    }

    // Controlla se si tratta effettivamente di un ricaricamento (F5 / reload)
    const navEntry = window.performance?.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
    const isReload = navEntry ? navEntry.type === "reload" : (window.performance as any)?.navigation?.type === 1;

    // Se non è un F5/reload (es. normale navigazione da link), non forzare lo scroll in cima
    if (!isReload) {
      return;
    }

    // Disabilita il ripristino automatico dello scroll da parte del browser
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Se l'URL conteneva un hash da una navigazione precedente, ripuliscilo al ricaricamento
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }

    // Riporta lo scroll in cima all'avvio
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }, 20);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
