"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AVAILABLE_ICONS, ICON_CATEGORIES, type IconCategory } from "@/lib/icons";
import { Search, X } from "lucide-react";

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (iconName: string) => void;
  onClose: () => void;
  className?: string;
}

export default function IconPicker({
  value,
  onChange,
  onClose,
  className,
}: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<IconCategory | "Tutte">("Tutte");
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const filtered = Object.entries(AVAILABLE_ICONS).filter(([name, meta]) => {
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      meta.label.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "Tutte" || meta.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-[340px] max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden",
        className
      )}
      style={{ maxHeight: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Scegli Icona
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca icona…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#9C1C1C]/40 bg-white"
            autoFocus
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-slate-100 overflow-x-auto scrollbar-hide flex-shrink-0">
        {(["Tutte", ...ICON_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat as any)}
            className={cn(
              "shrink-0 px-2 py-1 rounded-sm text-[10px] font-semibold transition-colors whitespace-nowrap",
              activeCategory === cat
                ? "bg-[#9C1C1C] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Icons grid */}
      <div className="overflow-y-auto flex-1 p-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nessuna icona trovata
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {filtered.map(([name, meta]) => {
              const IconComp = meta.component;
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={meta.label}
                  onClick={() => {
                    onChange(name);
                    onClose();
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-2 rounded-sm transition-all text-center group",
                    isSelected
                      ? "bg-[#9C1C1C]/15 ring-1 ring-[#9C1C1C]/50 text-[#9C1C1C]"
                      : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  )}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="text-[8px] leading-tight truncate w-full text-center opacity-60 group-hover:opacity-100">
                    {meta.label.split(" / ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}