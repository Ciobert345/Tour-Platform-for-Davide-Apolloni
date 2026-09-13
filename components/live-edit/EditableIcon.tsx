"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLiveEdit } from "./LiveEditProvider";
import { renderIconByName } from "@/lib/icons";
import IconPicker from "./IconPicker";
import supabase from "@/lib/supabase/browser";
import type { LucideProps } from "lucide-react";

interface EditableIconProps {
  id: string;
  iconName: string | null | undefined;
  className?: string;
  iconProps?: LucideProps;
  label?: string;
  stringKey?: string;
  credentialId?: string;
  tourTypeId?: string;
  onSave?: (newIcon: string) => Promise<void> | void;
  readOnly?: boolean;
}

export default function EditableIcon({
  id,
  iconName,
  className,
  iconProps = {},
  label,
  stringKey,
  credentialId,
  tourTypeId,
  onSave,
  readOnly = false,
}: EditableIconProps) {
  const liveEdit = useLiveEdit();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(iconName || "Info");
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (iconName) setCurrentIcon(iconName);
  }, [iconName]);

  const isEditable = liveEdit?.enabled && !readOnly;

  const togglePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pickerOpen) {
      setPickerOpen(false);
      setCoords(null);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
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

  const handleIconChange = async (newIcon: string) => {
    setCurrentIcon(newIcon);
    setSaving(true);
    try {
      if (onSave) {
        await onSave(newIcon);
      } else if (stringKey) {
        await (supabase.from("ui_strings") as any).upsert(
          {
            key: stringKey,
            it: newIcon,
            en: newIcon,
            description: label || `Icona ${stringKey}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
      } else if (credentialId) {
        await (supabase.from("credentials") as any)
          .update({ icon: newIcon })
          .eq("id", credentialId);
      } else if (tourTypeId) {
        await (supabase.from("tour_types") as any)
          .update({ icon: newIcon })
          .eq("id", tourTypeId);
      }

      // Notify parent frame in Live Editor
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "LIVE_EDIT_SAVED",
            targetId: id,
            iconName: newIcon,
          },
          "*"
        );
      }
    } catch (err) {
      console.error("Errore salvataggio icona:", err);
    } finally {
      setSaving(false);
      setPickerOpen(false);
      setCoords(null);
    }
  };

  if (!isEditable) {
    return (
      <span className={cn("inline-flex items-center justify-center shrink-0", className)}>
        {renderIconByName(currentIcon, iconProps)}
      </span>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={label ? `Modifica icona: ${label}` : "Clicca per cambiare icona"}
        onClick={togglePicker}
        className={cn(
          "inline-flex items-center justify-center p-1 rounded-sm transition-all cursor-pointer shrink-0",
          "hover:ring-2 hover:ring-[#9C1C1C] hover:bg-[#9C1C1C]/15 ring-offset-1",
          pickerOpen && "ring-2 ring-[#9C1C1C] bg-[#9C1C1C]/20",
          saving && "opacity-50 animate-pulse",
          className
        )}
      >
        {renderIconByName(currentIcon, iconProps)}
      </button>

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
              value={currentIcon}
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
    </>
  );
}
