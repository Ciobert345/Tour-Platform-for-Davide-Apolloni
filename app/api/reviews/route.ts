// ============================================================
// API: POST /api/reviews
// Invia una nuova recensione (sempre in stato 'pending' — RLS approva)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON non valido" },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  if (!payload.author_name || payload.author_name.trim().length < 2) {
    errors.push("Nome e cognome obbligatori (almeno 2 caratteri)");
  }
  if (!payload.review_text || payload.review_text.trim().length < 5) {
    errors.push("Il testo della recensione deve contenere almeno 5 caratteri");
  }
  const rating = Number(payload.rating);
  if (!rating || rating < 1 || rating > 5) {
    errors.push("Seleziona una valutazione (da 1 a 5 stelle)");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: errors[0], fields: errors },
      { status: 422 }
    );
  }

  try {
    const sb = createClient();
    const insert: ReviewInsert = {
      author_name: String(payload.author_name).trim().slice(0, 120),
      author_location_it: payload.author_location_it
        ? String(payload.author_location_it).trim().slice(0, 120)
        : null,
      author_location_en: payload.author_location_en
        ? String(payload.author_location_en).trim().slice(0, 120)
        : null,
      review_text: String(payload.review_text).trim().slice(0, 2000),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      status: "pending",
    };

    const { data, error } = await sb.from("reviews").insert([insert] as any).select("id").single() as any;

    if (error) {
      console.error("[POST /api/reviews] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error:
            error.code === "42501"
              ? "Errore autorizzazione RLS"
              : error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[POST /api/reviews] errore:", err);
    return NextResponse.json(
      { ok: false, error: "Errore interno" },
      { status: 500 }
    );
  }
}
