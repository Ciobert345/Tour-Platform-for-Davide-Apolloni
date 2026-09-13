"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Languages, ArrowRight, MousePointerClick, Loader2 } from "lucide-react";
import Link from "next/link";

export default function StringsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/live-editor");
    }, 400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#4A6535]/10 text-[#4A6535] flex items-center justify-center mx-auto mb-4">
        <Languages className="w-8 h-8" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-[#1E160A] mb-2">
        Modifica Testi integrata nell&apos;Editor Live Visuale
      </h1>
      <p className="text-sm text-[#5C4C38] mb-6 leading-relaxed">
        Tutte le traduzioni e i testi statici dell&apos;interfaccia sono ora modificabili direttamente cliccando sul testo desiderato nell&apos;<strong>Editor Live</strong>.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-4 h-4 text-[#4A6535] animate-spin" />
        <span className="text-xs text-[#7A6655]">Reindirizzamento in corso…</span>
      </div>
      <div className="mt-6">
        <Link
          href="/admin/live-editor"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4A6535] text-white rounded-sm text-sm font-semibold hover:bg-[#3A5228] transition-colors"
        >
          <MousePointerClick className="w-4 h-4" />
          Apri Editor Live
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
