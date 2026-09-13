"use client";

import React, { useEffect, useState } from "react";
import { useLiveEdit } from "./LiveEditProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { parseMarkdownLinksInNode, renderWithLinks } from "@/lib/renderWithLinks";
import type { LiveEditKind, LiveEditValues } from "@/lib/live-edit/types";

type EditableProps = {
  id: string;
  label: string;
  kind: LiveEditKind;
  stringKey?: string;
  profileField?: string;
  infoItemId?: string;
  infoField?: "title" | "content" | "category";
  quoteId?: string;
  quoteField?: "quote_text" | "author";
  cvItemId?: string;
  cvField?: "title" | "subtitle" | "description" | "institution";
  credentialId?: string;
  credentialField?: "title" | "description" | "institution";
  contactId?: string;
  contactField?: "label" | "value";
  mediaItemId?: string;
  mediaItemField?: "caption" | "url" | "type";
  section?: string;
  values: LiveEditValues;
  as?: "span" | "div" | "block";
  className?: string;
  children: React.ReactNode;
};

export default function Editable({
  id,
  label,
  kind,
  stringKey,
  profileField,
  infoItemId,
  infoField,
  quoteId,
  quoteField,
  cvItemId,
  cvField,
  credentialId,
  credentialField,
  contactId,
  contactField,
  mediaItemId,
  mediaItemField,
  section,
  values,
  as = "span",
  className,
  children,
}: EditableProps) {
  const liveEdit = useLiveEdit();
  const { lang } = useLang();
  
  // ✅ Stato per memorizzare i valori aggiornati in tempo reale
  const [liveValues, setLiveValues] = useState<LiveEditValues>(values);

  // ✅ Ascolta gli aggiornamenti in tempo reale dall'Editor Live
  useEffect(() => {
    if (!liveEdit?.enabled) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as any;
      
      // Quando riceviamo l'aggiornamento, sostituiamo i valori visualizzati
      if (data?.type === "LIVE_EDIT_UPDATED" && data.targetId === id) {
        setLiveValues(data.values);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, liveEdit?.enabled]);

  // Resetta i valori live se i valori originali cambiano (es. dopo un reload manuale)
  useEffect(() => {
    setLiveValues(values);
  }, [values]);

  if (!liveEdit?.enabled) {
    return <>{parseMarkdownLinksInNode(children)}</>;
  }

  const Tag = as === "block" ? "div" : as;
  const isSelected = liveEdit.selectedId === id;

  const handleSelect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    liveEdit.select(
      {
        id,
        label,
        kind,
        stringKey,
        profileField,
        infoItemId,
        infoField,
        quoteId,
        quoteField,
        cvItemId,
        cvField,
        credentialId,
        credentialField,
        contactId,
        contactField,
        mediaItemId,
        mediaItemField,
        section,
      },
      liveValues // ✅ Usa i valori live aggiornati
    );
  };

  // ✅ Se abbiamo un aggiornamento live e il tipo è "string" (non media/video/image), mostriamo il nuovo testo
  // invece dei children statici passati dal genitore.
  const hasLiveUpdate = liveValues.it !== values.it || liveValues.en !== values.en;
  const isMediaField =
    kind === "image" ||
    kind === "media_item" ||
    id.includes("video") ||
    id.includes("poster") ||
    id.includes("photo") ||
    id.includes("image");

  const rawString = lang === "it" ? liveValues.it : liveValues.en;
  const displayContent: React.ReactNode = (hasLiveUpdate && kind === "string" && !isMediaField)
    ? renderWithLinks(rawString)
    : parseMarkdownLinksInNode(children);

  return (
    <Tag
      role="button"
      tabIndex={0}
      data-live-edit-id={id}
      onMouseDown={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleSelect(e);
        }
      }}
      onMouseEnter={() => liveEdit.hover(id)}
      onMouseLeave={() => liveEdit.hover(null)}
      className={cn(
        "live-edit-target cursor-pointer transition-all duration-150 rounded-xs",
        as === "block" ? "block relative" : "inline-block relative max-w-full align-baseline",
        isSelected
          ? "ring-2 ring-[#9C1C1C] ring-offset-2 bg-[#9C1C1C]/10"
          : "hover:ring-2 hover:ring-[#9C1C1C]/50 hover:ring-offset-1 hover:bg-[#9C1C1C]/5",
        className
      )}
      title={`Modifica: ${label}`}
    >
      {displayContent}
    </Tag>
  );
}