"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, ArrowRight, MousePointerClick, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InfoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/live-editor?tab=faq");
    }, 400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#3D6E90]/10 text-[#3D6E90] flex items-center justify-center mx-auto mb-4">
        <Info className="w-8 h-8" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-[#1E160A] mb-2">
        Gestione FAQ &amp; Informazioni spostata nell&apos;Editor Live
      </h1>
      <p className="text-sm text-[#5C4C38] mb-6 leading-relaxed">
        Tutte le domande frequenti e le informazioni generali sono ora gestite comodamente dall&apos;<strong>Editor Live</strong>, con anteprima in tempo reale.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-4 h-4 text-[#3D6E90] animate-spin" />
        <span className="text-xs text-[#7A6655]">Reindirizzamento in corso…</span>
      </div>
      <div className="mt-6">
        <Link
          href="/admin/live-editor?tab=faq"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3D6E90] text-white rounded-sm text-sm font-semibold hover:bg-[#244D68] transition-colors"
        >
          <MousePointerClick className="w-4 h-4" />
          Apri Editor Live (FAQ &amp; Info)
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
