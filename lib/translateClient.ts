/**
 * Helper client per la traduzione automatica.
 * Chiama l'endpoint interno /api/translate (che supporta OpenAI e fallback su MyMemory).
 */

async function safeJson<T = any>(res: Response, fallback: T, context = ""): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    let raw = "";
    try {
      raw = await res.text();
    } catch {}
    console.warn(
      `[translateClient] Risposta non JSON (${contentType}).` +
        (context ? ` Context: ${context}` : "") +
        ` Prime 120 chars: ${(raw || "").slice(0, 120)}`
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
      `[translateClient] JSON.parse fallito: ${e?.message || e}.` +
        (context ? ` Context: ${context}` : "") +
        ` Prime 120 chars: ${(raw || "").slice(0, 120)}`
    );
    return fallback;
  }
}

export async function translateText(
  text: string,
  sourceLang = "it",
  targetLang = "en"
): Promise<string> {
  if (!text || !text.trim()) return "";

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), sourceLang, targetLang }),
    });

    if (!res.ok) {
      console.warn(`[translateClient] HTTP ${res.status} per traduzione "${text.slice(0, 40)}…"`);
      return text;
    }

    const data = await safeJson<{ translatedText?: string; error?: string }>(
      res,
      {},
      `/api/translate for "${text.slice(0, 40)}…"`
    );
    return data?.translatedText || text;
  } catch (err) {
    console.warn("Traduzione non disponibile, mantenuto testo originale:", err);
    return text;
  }
}

/**
 * Traduce testi lunghi dividendo per paragrafi/linee
 */
export async function translateLongText(
  text: string,
  sourceLang = "it",
  targetLang = "en"
): Promise<string> {
  if (!text || !text.trim()) return "";

  const lines = text.split("\n");
  const CHUNK_LIMIT = 450;
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    if (line.length > CHUNK_LIMIT) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < line.length; i += CHUNK_LIMIT) {
        chunks.push(line.slice(i, i + CHUNK_LIMIT));
      }
      continue;
    }

    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > CHUNK_LIMIT && current) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) {
    chunks.push(current);
  }

  const translated: string[] = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) {
      translated.push(chunk);
      continue;
    }
    const t = await translateText(chunk, sourceLang, targetLang);
    translated.push(t);
  }

  return translated.join("\n");
}
