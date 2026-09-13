export type LiveEditKind =
  | "string"
  | "style"
  | "profile"
  | "image"
  | "profile_number"
  | "info_item"
  | "quote"
  | "cv_item"
  | "credential"
  | "contact"
  | "media_item";

export interface LiveEditTarget {
  id: string;
  label: string;
  kind: LiveEditKind;
  /** Chiave ui_strings (kind = string) */
  stringKey?: string;
  /** Campo base profiles senza suffisso _it/_en (kind = profile | image | profile_number) */
  profileField?: string;
  /** ID info_items (kind = info_item) */
  infoItemId?: string;
  infoField?: "title" | "content" | "category";
  /** ID quotes (kind = quote) */
  quoteId?: string;
  quoteField?: "quote_text" | "author";
  /** ID cv_items (kind = cv_item) */
  cvItemId?: string;
  cvField?: "title" | "subtitle" | "description" | "institution";
  /** ID credentials (kind = credential) */
  credentialId?: string;
  credentialField?: "title" | "description" | "institution";
  /** ID contacts (kind = contact) */
  contactId?: string;
  contactField?: "label" | "value";
  /** ID media_items (kind = media_item) */
  mediaItemId?: string;
  mediaItemField?: "caption" | "url" | "type";
  section?: string;
}

export interface LiveEditValues {
  it?: string;
  en?: string;
  url?: string;
}

export type LiveEditMessage =
  | { type: "LIVE_EDIT_SELECT"; target: LiveEditTarget; values: LiveEditValues }
  | { type: "LIVE_EDIT_READY" }
  | { type: "LIVE_EDIT_SAVED"; targetId: string }
  | { type: "LIVE_EDIT_HOVER"; targetId: string | null }
  | { type: "LIVE_EDIT_UPDATED"; targetId: string; values: LiveEditValues }
  | { type: "LIVE_EDIT_SCROLL"; anchor: string };
