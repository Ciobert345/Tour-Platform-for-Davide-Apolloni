import React from "react";
import { renderWithLinks } from "./renderWithLinks";

/** Sostituisce placeholder %chiave% */
export function applyUiVars(text: string, vars: Record<string, string> = {}): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`%${key}%`).join(value);
  }
  return out;
}

/** Rimuove tag HTML (per textarea editor e testi semplici) */
export function stripHtmlTags(text: string): string {
  return text
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Renderizza testi UI con markup semplice (<span style="...">, <br>),
 * placeholder %name% e link in formato Markdown [testo](url).
 * Non usa dangerouslySetInnerHTML.
 *
 * Esempi di span supportati:
 * - Font: <span style="font-family:serif-italic">testo</span>  (Cormorant Garamond italic)
 * - Font: <span style="font-family:serif">testo</span>         (Cormorant Garamond regolare)
 * - Colore: <span style="color:#9C1C1C">testo</span>          (qualsiasi colore valido)
 * - Combinato: <span style="font-family:serif-italic;color:#9C1C1C">testo</span>
 */
export function renderUiRichText(
  text: string,
  vars: Record<string, string> = {}
): React.ReactNode {
  if (!text) return null;
  const resolved = applyUiVars(text, vars);
  return renderWithLinks(resolved);
}
