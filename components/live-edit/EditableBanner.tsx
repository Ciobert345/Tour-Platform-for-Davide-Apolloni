"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLiveEdit } from "./LiveEditProvider";
import { renderIconByName } from "@/lib/icons";
import { renderWithLinks } from "@/lib/renderWithLinks";
import IconPicker from "./IconPicker";
import supabase from "@/lib/supabase/browser";

export interface BannerData {
  id: string; // e.g. "1", "2"
  text_it: string;
  text_en: string;
  icon: string;
  style: "olive" | "neutral" | "terracotta" | "dark";
}

// Style variants with guaranteed high-contrast in both light and dark mode
const STYLE_MAP = {
  olive: "bg-olive/10 dark:bg-olive/25 border border-olive/30 dark:border-olive/50 text-olive-dark dark:text-[#c4e5ad]",
  neutral: "bg-bg-alt/90 dark:bg-[#352b23] border border-black/8 dark:border-white/15 text-text-main dark:text-[#fdf9f2] backdrop-blur-sm",
  terracotta: "bg-terracotta/10 dark:bg-terracotta/25 border border-terracotta/30 dark:border-terracotta/50 text-terracotta-dark dark:text-[#f59b9e]",
  dark: "bg-bg-dark/85 dark:bg-[#1c1611]/90 border border-text-white/15 dark:border-white/20 text-text-white dark:text-white backdrop-blur-sm",
};

const ICON_COLOR_MAP = {
  olive: "text-terracotta dark:text-[#f59b9e]",
  neutral: "text-olive-dark dark:text-[#e8b868]",
  terracotta: "text-terracotta dark:text-[#f59b9e]",
  dark: "text-terracotta dark:text-[#f59b9e]",
};

async function saveBannerField(
  bannerId: string,
  field: string,
  value: string
) {
  const key = `banner.${bannerId}.${field}`;
  await supabase.from("ui_strings").upsert(
    { key, it: value, en: value, description: `Banner ${bannerId} ${field}`, updated_at: new Date().toISOString() } as any,
    { onConflict: "key" }
  );
}

interface EditableBannerProps {
  banner: BannerData;
  lang: "it" | "en";
  readOnly?: boolean;
  className?: string;
  controls?: React.ReactNode;
}

export function EditableBanner({ banner, lang, readOnly, className, controls }: EditableBannerProps) {
  const liveEdit = useLiveEdit();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localIcon, setLocalIcon] = useState(banner.icon);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const iconBtnRef = useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setLocalIcon(banner.icon);
  }, [banner.icon]);

  const text = lang === "it" ? banner.text_it : banner.text_en;
  const isEditable = liveEdit?.enabled && !readOnly;

  const styleClass = STYLE_MAP[banner.style] ?? STYLE_MAP.neutral;
  const iconColor = ICON_COLOR_MAP[banner.style] ?? "text-terracotta";

  const togglePicker = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    if (pickerOpen) {
      setPickerOpen(false);
      setCoords(null);
      return;
    }
    if (iconBtnRef.current) {
      const rect = iconBtnRef.current.getBoundingClientRect();
      const pickerWidth = 340;
      const pickerHeight = 420;

      let left = rect.left;
      if (left + pickerWidth > window.innerWidth - 16) {
        left = window.innerWidth - pickerWidth - 16;
      }
      if (left < 16) left = 16;

      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + 8;
      if (spaceBelow < pickerHeight && rect.top > pickerHeight) {
        top = rect.top - pickerHeight - 8;
      }
      if (top < 16) top = 16;

      setCoords({ top, left });
    }
    setPickerOpen(true);
  };

  const handleIconChange = async (iconName: string) => {
    setLocalIcon(iconName);
    setSaving(true);
    try {
      await saveBannerField(banner.id, "icon", iconName);
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage({ type: "LIVE_EDIT_BANNER_ICON_SAVED", bannerId: banner.id, icon: iconName }, "*");
      }
    } finally {
      setSaving(false);
      setPickerOpen(false);
      setCoords(null);
    }
  };

  const handleTextClick = (e: React.SyntheticEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    liveEdit?.select(
      {
        id: `banner.${banner.id}.text`,
        label: `Banner – Testo (IT/EN)`,
        kind: "string",
        stringKey: `banner.${banner.id}.text`,
        section: "Hero – Banner",
      },
      {
        it: banner.text_it,
        en: banner.text_en,
      }
    );
  };

  if (!isEditable) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium tracking-wide shadow-2xs backdrop-blur-md transition-all duration-300 max-w-full",
          styleClass,
          className
        )}
      >
        {renderIconByName(localIcon, { className: cn("w-4 h-4 shrink-0", iconColor) })}
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide py-0.5">
          <span className="whitespace-nowrap block">{renderWithLinks(text)}</span>
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block max-w-full", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium tracking-wide cursor-pointer shadow-2xs backdrop-blur-md max-w-full",
          "ring-2 ring-offset-1 ring-[#9C1C1C]/40 hover:ring-[#9C1C1C] transition-all",
          styleClass,
          saving && "opacity-60"
        )}
      >
        {/* Icon — click to change */}
        <button
          ref={iconBtnRef}
          type="button"
          title="Clicca per cambiare icona"
          onClick={togglePicker}
          className={cn(
            "p-0.5 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/15 shrink-0",
            iconColor
          )}
        >
          {renderIconByName(localIcon, { className: "w-4 h-4 shrink-0" })}
        </button>

        {/* Text — click to edit */}
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide py-0.5">
          <button
            type="button"
            title="Clicca per modificare il testo"
            onClick={handleTextClick}
            className="text-left hover:opacity-75 transition-opacity whitespace-nowrap block cursor-pointer"
          >
            {renderWithLinks(text)}
          </button>
        </div>

        {controls}
      </div>

      {/* Icon picker popup in portal */}
      {pickerOpen && coords && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[999999] pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPickerOpen(false);
            setCoords(null);
          }}
        >
          <div
            className="fixed z-[1000000] shadow-2xl rounded-md"
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconPicker
              value={localIcon}
              onChange={handleIconChange}
              onClose={() => {
                setPickerOpen(false);
                setCoords(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default EditableBanner;
