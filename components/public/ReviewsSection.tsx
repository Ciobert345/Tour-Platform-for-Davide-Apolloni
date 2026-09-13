"use client";

import { useState } from "react";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";
import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import LiveEditSectionMask from "@/components/live-edit/LiveEditSectionMask";
import { cn, renderStars } from "@/lib/utils";
import { Star, Quote, Send, CheckCircle2, Sparkles, MessageSquare, User, MapPin, AlertTriangle } from "lucide-react";
import type { Database, Lang } from "@/types/database.types";

type ReviewT = Database["public"]["Tables"]["reviews"]["Row"];

export default function ReviewsSection({ reviews }: { reviews: ReviewT[] }) {
  const t = useT();
  const { lang } = useLang();

  return (
    <section id="recensioni" className="section bg-[#F9F4EC] border-b border-black/5">
      <div className="container-app">
        <EditableSectionHeading
          section="Recensioni"
          subtitleKey="reviews.subtitle"
          titleKey="reviews.title"
        />
        <div className="section-divider">
          <span className="w-12 h-px bg-gold/50" />
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="w-12 h-px bg-gold/50" />
        </div>

        <LiveEditSectionMask
          adminHref="/admin/reviews"
          adminLabel="Recensioni"
          hint="Testimonianze pubblicate e moderazione. Il form a destra è per i visitatori."
          minHeight="min-h-[360px]"
        >
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
            {/* COLONNA SINISTRA: Recensioni */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-dark">
                  {lang === "it" ? "Esperienze dei Viaggiatori" : "Traveler Experiences"}
                </span>
                <span className="text-xs text-text-muted font-light">
                  {reviews.length} {lang === "it" ? "recensioni" : "reviews"}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted border border-dashed border-black/15 rounded-xl bg-white">
                  <Quote className="w-8 h-8 mx-auto mb-2 opacity-25 text-terracotta" />
                  <p className="font-light">{t("reviews.empty")}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {reviews.map((r) => {
                    const loc =
                      lang === "it"
                        ? r.author_location_it
                        : r.author_location_en ?? r.author_location_it;
                    return (
                      <blockquote
                        key={r.id}
                        className="bg-white p-3.5 sm:p-5 rounded-2xl border border-black/10 shadow-xs hover:border-gold/40 hover:shadow-sm transition-all duration-300 relative"
                      >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <div className="text-gold text-xs sm:text-sm tracking-wider font-semibold">
                            {renderStars(r.rating)}
                          </div>
                          <span className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-gold-dark font-bold bg-gold/10 px-2 py-0.5 rounded-full">
                            {lang === "it" ? "Verificata" : "Verified"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[0.92rem] text-text-muted italic leading-relaxed font-serif mb-2 sm:mb-3">
                          "{r.review_text}"
                        </p>
                        <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] sm:text-xs">
                          <p className="font-bold text-text-main">{r.author_name}</p>
                          {loc && <p className="text-text-light font-light">{loc}</p>}
                        </div>
                      </blockquote>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLONNA DESTRA: Form lascia recensione */}
            <div className="bg-white p-3.5 sm:p-6 md:p-8 rounded-2xl border border-black/10 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3.5 sm:mb-5 pb-2.5 sm:pb-3 border-b border-black/5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-text-main leading-tight">
                    {t("reviews.formTitle")}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-text-muted font-light">
                    {lang === "it" ? "La tua opinione è preziosa per noi" : "Your feedback is valuable to us"}
                  </p>
                </div>
              </div>

              <ReviewForm />
            </div>
          </div>
        </LiveEditSectionMask>
      </div>
    </section>
  );
}

/* =========================================================
   FORM — lascia una recensione compatto & allineato
   ========================================================= */
function ReviewForm() {
  const t = useT();
  const { lang } = useLang();
  const [rating, setRating] = useState<number>(5);
  const [hover, setHover] = useState<number>(0);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setState("loading");
    const fd = new FormData(e.currentTarget);
    const payload = {
      author_name: String(fd.get("author_name") ?? "").trim(),
      author_location_it: lang === "it" ? String(fd.get("author_location") ?? "").trim() : null,
      author_location_en: lang === "en" ? String(fd.get("author_location") ?? "").trim() : null,
      review_text: String(fd.get("review_text") ?? "").trim(),
      rating,
    };
    if (payload.author_name.length < 2) {
      setErr(lang === "it" ? "Inserisci il tuo nome e cognome." : "Please enter your full name.");
      setState("error");
      return;
    }
    if (payload.review_text.length < 5) {
      setErr(
        lang === "it"
          ? "Il testo della recensione deve contenere almeno 5 caratteri."
          : "Review text must be at least 5 characters."
      );
      setState("error");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Errore invio");
      setState("success");
      (e.target as HTMLFormElement).reset();
      setRating(5);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || t("form.error"));
      setState("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2.5 sm:space-y-4" noValidate>
      {/* Campi Nome e Città affiancati su 2 colonne a larghezza piena */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
        <div className="form-group">
          <label className="form-label text-[10.5px] sm:text-xs mb-0.5">
            {t("form.name")} <span className="required">*</span>
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-text-light absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              required
              name="author_name"
              type="text"
              className="form-control text-xs sm:text-sm pl-7 sm:pl-9 py-1.5 sm:py-2.5 w-full"
              placeholder={t("reviews.namePh")}
              minLength={2}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label text-[10.5px] sm:text-xs mb-0.5">
            {lang === "it" ? "Città / Nazione" : "City / Country"}
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-text-light absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="author_location"
              type="text"
              className="form-control text-xs sm:text-sm pl-7 sm:pl-9 py-1.5 sm:py-2.5 w-full"
              placeholder={lang === "it" ? "Es. Verona, Italia" : "e.g. London, UK"}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 p-2 bg-[#F9F4EC] rounded-xl border border-black/5">
        <label className="text-[10.5px] sm:text-xs font-bold uppercase tracking-wider text-text-main shrink-0">
          {t("reviews.ratingLabel")} <span className="required">*</span>
        </label>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 sm:p-1 rounded-xl hover:bg-white transition-colors cursor-pointer"
              aria-label={`${n} stelle`}
            >
              <Star
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                  ((hover || rating) >= n
                    ? "fill-gold text-gold"
                    : "text-black/20")
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label text-[10.5px] sm:text-xs mb-0.5">
          {t("reviews.textPh")} <span className="required">*</span>
        </label>
        <textarea
          required
          name="review_text"
          rows={2}
          className="form-textarea text-xs sm:text-sm py-1.5 sm:py-2.5 min-h-[60px] sm:min-h-[85px] leading-relaxed rounded-xl"
          placeholder={t("reviews.textPh")}
          minLength={5}
        />
      </div>

      {state === "success" && (
        <div className="bg-olive/10 border border-olive/30 text-olive-dark p-3 rounded-xl text-center font-semibold text-xs flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-olive shrink-0" />
          <span>{t("reviews.success")}</span>
        </div>
      )}
      {state === "error" && (
        <div className="bg-terracotta/10 border border-terracotta/30 text-terracotta p-3 rounded-xl text-center font-semibold text-xs flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-terracotta shrink-0" />
          <span>{err || t("reviews.error")}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className={cn(
          "btn btn-primary w-full py-2.5 text-xs uppercase font-bold tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2",
          state === "loading" && "opacity-60 cursor-not-allowed"
        )}
      >
        <Send className="w-3.5 h-3.5" />
        {state === "loading" ? t("form.submitting") : t("reviews.submit")}
      </button>
    </form>
  );
}



