"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  } as const;

  return (
    <div
      className="admin-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E160A]/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-[#1c1611] w-full rounded-sm shadow-2xl border border-[#E9DCC4] dark:border-[#382b20] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-[#E9DCC4] dark:border-[#382b20] flex items-center justify-between shrink-0">
          <h3 className="font-serif text-lg md:text-xl font-semibold text-[#1E160A] dark:text-[#f5ede2]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm hover:bg-[#F0E8D6] dark:hover:bg-[#2c221a] text-[#7A6655] dark:text-[#c7b59f] hover:text-[#1E160A] dark:hover:text-[#f5ede2] flex items-center justify-center transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-5 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
