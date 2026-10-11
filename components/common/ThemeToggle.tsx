"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon" | "admin";
  showLabel?: boolean;
}

export default function ThemeToggle({
  className,
  variant = "pill",
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { lang } = useLang();

  const isDark = resolvedTheme === "dark";

  const labelText = isDark
    ? lang === "it"
      ? "Tema Chiaro"
      : "Light Mode"
    : lang === "it"
    ? "Tema Scuro"
    : "Dark Mode";

  const tooltipText = isDark
    ? lang === "it"
      ? "Passa al tema chiaro"
      : "Switch to light mode"
    : lang === "it"
    ? "Passa al tema scuro"
    : "Switch to dark mode";

  if (variant === "admin") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-medium transition-all duration-200 cursor-pointer select-none",
          "border border-[#E9DCC4] dark:border-[#3d2e20]",
          "bg-[#F9F4EC] dark:bg-[#231b14] text-[#5C4C38] dark:text-[#d6c5b0]",
          "hover:bg-[#f0e4cf] dark:hover:bg-[#2c221a] hover:text-[#1E160A] dark:hover:text-[#f5ede2]",
          className
        )}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-gold shrink-0 transition-transform duration-300 rotate-0" />
          ) : (
            <Sun className="w-4 h-4 text-terracotta shrink-0 transition-transform duration-300 rotate-0" />
          )}
          <span>{isDark ? "Dark Mode attiva" : "Light Mode attiva"}</span>
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#7A6655] dark:text-[#d6c5b0]">
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-300 ease-out cursor-pointer select-none",
        variant === "icon"
          ? "w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-muted hover:text-text-main"
          : "h-7 sm:h-8 px-2 sm:px-2.5 rounded-full bg-[#E9DCC4]/80 dark:bg-[#2b2118] border border-black/10 dark:border-white/15 shadow-2xs hover:border-gold/50 text-text-main",
        className
      )}
      title={tooltipText}
      aria-label={tooltipText}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative w-4 h-4 flex items-center justify-center">
          <Sun
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a87e3c] transition-all duration-300 absolute inset-0 m-auto",
              isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dfb875] transition-all duration-300 absolute inset-0 m-auto",
              isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
            )}
          />
        </span>
        {showLabel && (
          <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
            {labelText}
          </span>
        )}
      </div>
    </button>
  );
}
