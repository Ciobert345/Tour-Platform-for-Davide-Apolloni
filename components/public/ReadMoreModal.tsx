"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Image from "next/image";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { renderWithLinks } from "@/lib/renderWithLinks";

export default function ReadMoreModal({
  open,
  onClose,
  title,
  body,
  cover,
  badge,
  closeLabel = "Chiudi",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  cover?: string | null;
  badge?: string | null;
  closeLabel?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="read-more-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {cover ? (
          <div className="relative h-44 sm:h-52 bg-stone/20 shrink-0">
            <Image
              src={optimizeImageUrl(cover, 800, 80)}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {badge && (
              <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-white/10">
                {badge}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5 pr-14">
              <h2
                id="read-more-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              aria-label={closeLabel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 shrink-0">
            <h2 id="read-more-title" className="font-serif text-xl sm:text-2xl font-bold text-text-main leading-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 shrink-0 rounded-full bg-black/5 flex items-center justify-center text-text-muted hover:bg-black/10 transition-colors"
              aria-label={closeLabel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
          <div className="text-sm text-text-muted leading-relaxed font-light whitespace-pre-wrap">
            {renderWithLinks(body)}
          </div>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-black/5 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
