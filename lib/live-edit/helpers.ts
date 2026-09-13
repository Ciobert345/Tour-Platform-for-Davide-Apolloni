import type { LiveEditValues } from "./types";
import { stripHtmlTags } from "@/lib/rich-text";

type StringMap = Record<string, { it: string; en: string }>;

export function stringValues(
  strings: StringMap,
  key: string,
  defaultIt = "",
  defaultEn = ""
): LiveEditValues {
  const s = strings[key];
  return {
    it: stripHtmlTags(s?.it || defaultIt),
    en: stripHtmlTags(s?.en || defaultEn || defaultIt),
  };
}

export function profileValues(
  profile: Record<string, unknown> | null | undefined,
  field: string
): LiveEditValues {
  if (!profile) return { it: "", en: "" };
  return {
    it: String(profile[`${field}_it`] ?? ""),
    en: String(profile[`${field}_en`] ?? ""),
  };
}

export function imageValue(url: string | null | undefined): LiveEditValues {
  return { url: url ?? "" };
}
