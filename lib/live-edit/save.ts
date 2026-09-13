import supabase from "@/lib/supabase/browser";
import type { LiveEditTarget, LiveEditValues } from "./types";

export async function saveLiveEdit(
  target: LiveEditTarget,
  values: LiveEditValues,
  profileId: string | null
) {
  // 1. UI Strings (testi, immagini di sfondo, video URL, icone, banner)
  if ((target.kind === "string" || target.kind === "style" || target.kind === "image" || (target.kind as string) === "video") && target.stringKey) {
    const val = values.url || values.it || "";
    const { error } = await supabase.from("ui_strings").upsert(
      {
        key: target.stringKey,
        it: values.it !== undefined && values.it !== "" ? values.it : val,
        en: values.en !== undefined && values.en !== "" ? values.en : val,
        description: target.label,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "key" }
    );
    if (error) throw error;
    return;
  }

  // 2. Info Item (FAQ)
  if (target.kind === "info_item" && target.infoItemId && target.infoField) {
    const payload: Record<string, string> = {
      [`${target.infoField}_it`]: values.it ?? "",
      [`${target.infoField}_en`]: values.en ?? "",
    };
    const { error } = await (supabase.from("info_items") as any)
      .update(payload)
      .eq("id", target.infoItemId);
    if (error) throw error;
    return;
  }

  // 3. Quotes
  if (target.kind === "quote" && target.quoteId && target.quoteField) {
    const field = target.quoteField; // e.g. 'quote_text' or 'author'
    const payload: Record<string, string> = {
      [`${field}_it`]: values.it ?? "",
      [`${field}_en`]: values.en ?? "",
    };
    const { error } = await (supabase.from("quotes") as any)
      .update(payload)
      .eq("id", target.quoteId);
    if (error) throw error;
    return;
  }

  // 4. CV Item
  if (target.kind === "cv_item" && target.cvItemId && target.cvField) {
    const payload: Record<string, string> = {
      [`${target.cvField}_it`]: values.it ?? "",
      [`${target.cvField}_en`]: values.en ?? "",
    };
    const { error } = await (supabase.from("cv_items") as any)
      .update(payload)
      .eq("id", target.cvItemId);
    if (error) throw error;
    return;
  }

  // 5. Credential
  if (target.kind === "credential" && target.credentialId && target.credentialField) {
    let payload: Record<string, any> = {};
    if (target.credentialField === ("icon" as any)) {
      payload = { icon: values.it || values.en || null };
    } else {
      payload = {
        [`${target.credentialField}_it`]: values.it ?? "",
        [`${target.credentialField}_en`]: values.en ?? "",
      };
    }
    const { error } = await (supabase.from("credentials") as any)
      .update(payload)
      .eq("id", target.credentialId);
    if (error) throw error;
    return;
  }

  // 6. Contact
  if (target.kind === "contact" && target.contactId) {
    const payload: Record<string, any> = {};
    if (target.contactField === "value") {
      payload.value = values.it || values.en || "";
    } else if (target.contactField === "label") {
      payload.label_it = values.it ?? "";
      payload.label_en = values.en ?? "";
    }
    const { error } = await (supabase.from("contacts") as any)
      .update(payload)
      .eq("id", target.contactId);
    if (error) throw error;
    return;
  }

  // 7. Media Item (Gallery / Video)
  if (target.kind === "media_item" && target.mediaItemId) {
    const { data: existing } = await (supabase.from("media_items") as any)
      .select("*")
      .eq("id", target.mediaItemId)
      .maybeSingle();

    const payload: Record<string, any> = {
      id: target.mediaItemId,
      type: existing?.type || "image",
      url: existing?.url || values.url || values.it || "",
      caption_it: existing?.caption_it ?? (values.it || ""),
      caption_en: existing?.caption_en ?? (values.en || ""),
      sort_order: existing?.sort_order ?? 1,
      is_active: true,
    };

    if (target.mediaItemField === "url") {
      payload.url = values.url || values.it || "";
    } else if (target.mediaItemField === "caption") {
      payload.caption_it = values.it ?? "";
      payload.caption_en = values.en ?? "";
    }

    const { error } = await (supabase.from("media_items") as any).upsert(payload, {
      onConflict: "id",
    });
    if (error) throw error;
    return;
  }

  // 5. Profiles
  if (!profileId) {
    throw new Error("Profilo non trovato — salva prima i dati profilo da Editor Live → Profilo");
  }

  if (target.kind === "image" && target.profileField) {
    const { error } = await (supabase.from("profiles") as any)
      .update({ [target.profileField]: values.url ?? null })
      .eq("id", profileId);
    if (error) throw error;
    return;
  }

  if (target.kind === "profile_number" && target.profileField) {
    const num = parseInt(String(values.it ?? ""), 10);
    if (isNaN(num)) throw new Error("Inserisci un numero valido");
    const { error } = await (supabase.from("profiles") as any)
      .update({ [target.profileField]: num })
      .eq("id", profileId);
    if (error) throw error;
    return;
  }

  if (target.kind === "profile" && target.profileField) {
    const payload: Record<string, string> = {
      [`${target.profileField}_it`]: values.it ?? "",
      [`${target.profileField}_en`]: values.en ?? "",
    };
    const { error } = await (supabase.from("profiles") as any)
      .update(payload)
      .eq("id", profileId);
    if (error) throw error;
    return;
  }

  throw new Error("Tipo di elemento non supportato");
}
