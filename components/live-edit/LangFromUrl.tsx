"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";

/** Sincronizza la lingua dell'anteprima con ?lang=it|en (editor live) */
export default function LangFromUrl() {
  const searchParams = useSearchParams();
  const { setLang } = useLang();

  useEffect(() => {
    const l = searchParams.get("lang");
    if (l === "it" || l === "en") setLang(l);
  }, [searchParams, setLang]);

  return null;
}
