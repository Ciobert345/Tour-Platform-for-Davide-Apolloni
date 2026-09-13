"use client";

import { useState } from "react";
import { Languages, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import supabase from "@/lib/supabase/browser";

interface TranslateButtonProps {
  sourceText: string;
  onTranslated: (translatedText: string) => void;
  sourceLang?: string;
  targetLang?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

async function safeJson<T = any>(res: Response, fallback: T): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    let raw = "";
    try {
      raw = await res.text();
    } catch {}
    console.warn(
      `[TranslateButton] Risposta non JSON: ${contentType}. Prime 120 chars: ${(raw || "").slice(0, 120)}`
    );
    return fallback;
  }
  try {
    return (await res.json()) as T;
  } catch (e: any) {
    let raw = "";
    try {
      raw = await res.clone().text();
    } catch {}
    console.warn(
      `[TranslateButton] JSON.parse fallito: ${e?.message || String(e)}. Prime 120 chars: ${(raw || "").slice(0, 120)}`
    );
    return fallback;
  }
}

export default function TranslateButton({
  sourceText,
  onTranslated,
  sourceLang = "it",
  targetLang = "en",
  disabled = false,
  size = "sm",
}: TranslateButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTranslate = async () => {
    if (!sourceText || sourceText.trim().length === 0) return;

    setIsTranslating(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await safeJson<{ translatedText?: string; error?: string }>(res, {});

      if (data?.translatedText) {
        onTranslated(data.translatedText);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        onTranslated(sourceText);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (err: any) {
      console.error("Errore traduzione:", err);
      onTranslated(sourceText);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setIsTranslating(false);
    }
  };

  const sizeClasses = size === "sm" 
    ? "px-2.5 py-1 text-xs" 
    : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={isTranslating || disabled || !sourceText || sourceText.trim().length === 0}
      className={`inline-flex items-center gap-1.5 font-medium text-[#537385] bg-[#537385]/10 hover:bg-[#537385]/20 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
      title={sourceText ? "Traduci automaticamente dall'italiano" : "Inserisci prima il testo in italiano"}
    >
      {isTranslating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : status === "success" ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6535]" />
      ) : status === "error" ? (
        <AlertCircle className="w-3.5 h-3.5 text-[#9C1C1C]" />
      ) : (
        <Languages className="w-3.5 h-3.5" />
      )}
      {isTranslating ? "Traduzione..." : status === "success" ? "Tradotto!" : "Traduci in EN"}
    </button>
  );
}