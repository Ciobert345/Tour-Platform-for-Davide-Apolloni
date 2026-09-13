import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lang } from "@/types/database.types";

/**
 * Combina classi Tailwind evitando conflitti (es. 'p-2 p-4' → 'p-4')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper per prendere la versione bilingue di un campo.
 * Le entità del DB usano suffissi _it/_en (es. name_it, name_en).
 * Se manca la versione EN, fallback a IT
 */
export function tField<
  T extends Record<string, any>,
  K extends string,
>(
  row: T,
  baseKey: K,
  lang: Lang
): string | null | undefined {
  const keyIt = `${String(baseKey)}_it` as keyof T;
  const keyEn = `${String(baseKey)}_en` as keyof T;
  const val = lang === "it" ? row[keyIt] : row[keyEn] ?? row[keyIt];
  return typeof val === "string" || val == null ? (val as any) : String(val);
}

/**
 * Variante di tField con default a stringa vuota invece di null/undefined
 */
export function tFieldStr<T extends Record<string, any>, K extends string>(
  row: T,
  baseKey: K,
  lang: Lang
): string {
  return String(tField(row, baseKey, lang) ?? "");
}

/**
 * Tags bilingui (array `tags_it`, `tags_en`)
 */
export function tArrField<T extends Record<string, any>, K extends string>(
  row: T,
  baseKey: K,
  lang: Lang
): string[] {
  const keyIt = `${String(baseKey)}_it` as keyof T;
  const keyEn = `${String(baseKey)}_en` as keyof T;
  const arr = lang === "it" ? row[keyIt] : (row[keyEn] ?? row[keyIt]);
  return Array.isArray(arr) ? arr.filter((x: any): x is string => typeof x === "string") : [];
}

/**
 * Format data italiana o inglese a partire da ISO string
 */
export function formatDate(iso: string | null | undefined, lang: Lang = "it") {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(lang === "it" ? "it-IT" : "en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(iso);
  }
}

/**
 * Messaggi Supabase/Postgres più leggibili in admin
 */
export function formatDbError(message: string): string {
  if (message.includes("events_tour_type_id_fkey")) {
    return "Impossibile eliminare o sostituire la categoria: è collegata a uno o più eventi nel calendario. Riassegna o elimina prima gli eventi in Admin → Eventi, oppure disattiva la categoria.";
  }
  if (message.includes("violates foreign key constraint")) {
    return "Operazione bloccata: esistono altri record collegati a questa voce. Elimina o riassegna i collegamenti prima di procedere.";
  }
  return message;
}

/**
 * Helper per valutazioni a stelle
 */
export function renderStars(n: number): string {
  const full = "★".repeat(Math.max(0, Math.min(5, n)));
  const empty = "☆".repeat(Math.max(0, 5 - n));
  return full + empty;
}
