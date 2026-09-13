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

// Style variants
const STYLE_MAP = {
  olive: "bg-olive/10 border border-olive/30 text-olive-dark",
  neutral: "bg-bg-alt/90 border border-black/5 text-text-main backdrop-blur-sm",
  terracotta: "bg-terracotta/10 border border-terracotta/30 text-terracotta-dark",
  dark: "bg-bg-dark/80 border border-text-white/10 text-text-white backdrop-blur-sm",
};

const ICON_COLOR_MAP = {
  olive: "text-terracotta",
  neutral: "text-olive-dark",
  terracotta: "text-terracotta",
  dark: "text-terracotta",
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
}

export function EditableBanner({ banner, lang, readOnly }: EditableBannerProps) {
  const liveEdit = useLiveEdit();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localIcon, setLocalIcon] = useState(banner.icon);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const iconBtnRef = useRef<HTMLButtonElement>(null);

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
      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold whitespace-normal sm:whitespace-nowrap text-center sm:text-left", styleClass)}>
        {renderIconByName(localIcon, { className: cn("w-4 h-4 shrink-0", iconColor) })}
        <span>{renderWithLinks(text)}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold whitespace-nowrap cursor-pointer",
        "ring-2 ring-offset-1 ring-[#9C1C1C]/40 hover:ring-[#9C1C1C] transition-all",
        styleClass,
        saving && "opacity-60"
      )}>
        {/* Icon — click to change */}
        <button
          ref={iconBtnRef}
          type="button"
          title="Clicca per cambiare icona"
          onClick={togglePicker}
          className={cn(
            "p-0.5 rounded transition-colors hover:bg-[#9C1C1C]/20",
            iconColor
          )}
        >
          {renderIconByName(localIcon, { className: "w-4 h-4 shrink-0" })}
        </button>

        {/* Text — click to edit */}
        <button
          type="button"
          title="Clicca per modificare il testo"
          onClick={handleTextClick}
          className="text-left hover:opacity-70 transition-opacity"
        >
          {renderWithLinks(text)}
        </button>
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
