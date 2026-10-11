"use client";

import { useEffect } from "react";

/**
 * Assicura che al ricaricamento (F5 / reload) della pagina l'utente
 * si trovi sempre all'inizio del sito (Hero) e non posizionato su una
 * sezione precedente come #chi-sono.
 */
export default function ScrollToTopOnReload() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disabilita il ripristino automatico dello scroll da parte del browser
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Se l'URL conteneva un hash da una navigazione precedente, ripuliscilo
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }

    // Riporta lo scroll in cima sia all'avvio che dopo il primo repaint
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }, 20);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
