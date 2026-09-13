import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

async function safeJsonOrFallback<T = any>(
  res: Response,
  fallback: T,
  logLabel: string
): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    let raw = "";
    try {
      raw = await res.text();
    } catch {}
    console.warn(
      `[/api/translate] ${logLabel} ha restituito content-type=${contentType} invece di JSON. Prime 150 chars:`,
      (raw || "").slice(0, 150)
    );
    return fallback;
  }
  try {
    return (await res.json()) as T;
  } catch (e: any) {
    let raw = "";
    try {
      raw = await res.clone().text();
    } catch {}
    console.warn(
      `[/api/translate] ${logLabel} JSON.parse fallito: ${e?.message || String(e)}. Prime 150 chars:`,
      (raw || "").slice(0, 150)
    );
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { translatedText: "", error: "Body non valido" },
        { status: 400 }
      );
    }
    const { text, sourceLang = "it", targetLang = "en" } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ translatedText: "" });
    }

    const trimmed = text.trim();

    // 1. Se è configurata la chiave OPENAI_API_KEY nel server, usiamo OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator for a tourist guide and cultural historian website. Translate the given text from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}. Keep all Markdown formatting, link structures [text](url), and HTML inline tags (such as <span style="...">...</span>) intact. Translate the words inside HTML tags while preserving the exact span tags and their style attributes intact in the corresponding translated position. Return ONLY the translated text without commentary.`,
              },
              { role: "user", content: trimmed },
            ],
            temperature: 0.3,
          }),
        });

        if (aiRes.ok) {
          const aiJson = (await safeJsonOrFallback(
            aiRes,
            null as unknown as null,
            "OpenAI"
          )) as {
            choices?: Array<{ message?: { content?: string } }>;
          } | null;
          const translated = aiJson?.choices?.[0]?.message?.content?.trim();
          if (translated) {
            return NextResponse.json({ translatedText: translated });
          }
          console.warn("[/api/translate] OpenAI: risposta non conteneva translatedText, fallback...");
        } else {
          const statusTxt = `HTTP ${aiRes.status}`;
          let details = "";
          try { details = (await aiRes.text()).slice(0, 200); } catch {}
          console.warn(`[/api/translate] OpenAI KO (${statusTxt}): ${details}`);
        }
      } catch (e) {
        console.warn("[/api/translate] OpenAI error, falling back to MyMemory:", e);
      }
    }

    // 2. Fallback affidabile: MyMemory Translation API
    const langPair = `${sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langPair}`;

    const res = await fetch(myMemoryUrl, {
      headers: { "User-Agent": "DavideApolloniSite/1.0" },
    }).catch((err) => {
      console.warn("[/api/translate] MyMemory fetch network error:", err);
      return null;
    });

    if (!res) {
      return NextResponse.json({ translatedText: trimmed });
    }

    if (!res.ok) {
      console.warn(`[/api/translate] MyMemory HTTP ${res.status}, restituisco testo originale`);
      return NextResponse.json({ translatedText: trimmed });
    }

    const data = (await safeJsonOrFallback(
      res,
      null,
      "MyMemory"
    )) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    } | null;

    if (!data) {
      return NextResponse.json({ translatedText: trimmed });
    }

    const translatedText = data.responseData?.translatedText;

    if (!translatedText || data.responseStatus === 403) {
      return NextResponse.json({ translatedText: trimmed });
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("[/api/translate] Errore route (catch finale):", error);
    return NextResponse.json(
      { translatedText: "", error: error?.message || "Errore durante la traduzione" },
      { status: 200 }
    );
  }
}
