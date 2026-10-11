"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "da_theme_preference";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Inizializzazione tema al mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    } catch {
      // Ignora errori di storage (es. incognito/sandboxed)
    }
    setMounted(true);
  }, []);

  // Risoluzione e applicazione della classe .dark sull'elemento html
  useEffect(() => {
    const root = document.documentElement;
    const currentResolved: ResolvedTheme =
      theme === "system" ? getSystemTheme() : theme;

    setResolvedTheme(currentResolved);

    if (currentResolved === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    // Se l'utente è dentro un iframe (Live Editor preview), sincronizza con il parent
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "THEME_UPDATED", theme: currentResolved }, "*");
    }
  }, [theme]);

  // Ascolto cambio preferenze di sistema quando theme === "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      if (newResolved === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Ascolto messaggi postMessage dal parent (es. Live Editor Toolbar che cambia tema all'iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "SET_THEME" && (event.data.theme === "light" || event.data.theme === "dark" || event.data.theme === "system")) {
        setThemeState(event.data.theme);
        try {
          localStorage.setItem(STORAGE_KEY, event.data.theme);
        } catch {}
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: mounted ? resolvedTheme : "light",
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback sicuro se usato fuori dal provider
    return {
      theme: "light" as Theme,
      resolvedTheme: "light" as ResolvedTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
