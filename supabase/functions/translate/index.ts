// Edge Function: translate
// -----------------------------------------------------------------------------
// Traduce testo da italiano a inglese (o viceversa) preservando link markdown.
// Utilizza OpenAI se OPENAI_API_KEY è configurata, altrimenti MyMemory API.
// -----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "OPTIONS, POST, HEAD",
  "Access-Control-Max-Age": "86400",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Metodo non consentito" }),
      { status: 405, headers: JSON_HEADERS }
    );
  }

  try {
    const { text, sourceLang = "it", targetLang = "en" } = await req.json().catch(() => ({}));

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ translatedText: "" }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    const trimmed = text.trim();
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    // 1. OpenAI (se presente la chiave nei secrets Supabase)
    if (openAiKey) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator for a cultural tour guide website. Translate the given text from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}. Keep markdown link syntax [text](url) intact. Return ONLY the translated string without quotes or notes.`,
              },
              { role: "user", content: trimmed },
            ],
            temperature: 0.3,
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const translated = aiJson.choices?.[0]?.message?.content?.trim();
          if (translated) {
            return new Response(
              JSON.stringify({ translatedText: translated }),
              { status: 200, headers: JSON_HEADERS }
            );
          }
        }
      } catch (e) {
        console.warn("[translate] OpenAI error:", e);
      }
    }

    // 2. Fallback MyMemory
    const langPair = `${sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langPair}`;

    const res = await fetch(myMemoryUrl);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ translatedText: trimmed }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    const data = await res.json();
    const translatedText = data.responseData?.translatedText || trimmed;

    return new Response(
      JSON.stringify({ translatedText }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal error", translatedText: "" }),
      { status: 200, headers: JSON_HEADERS }
    );
  }
});
