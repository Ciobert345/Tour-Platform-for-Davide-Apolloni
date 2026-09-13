// ============================================================
// API: POST /api/bookings
// Salva la prenotazione nel DB e INVIA la conferma all'utente
// Richiede:
//   - Supabase Service Role (SUPABASE_SERVICE_ROLE_KEY) come safety net RLS
//   - Secrets configurati in Supabase Edge Functions: RESEND_API_KEY ecc.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

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

  // --------------------------------------------------------------------------
  // Validazione base
  // --------------------------------------------------------------------------
  const errors: string[] = [];
  if (
    !payload.full_name ||
    typeof payload.full_name !== "string" ||
    payload.full_name.trim().length < 2
  ) {
    errors.push("name");
  }
  if (
    !payload.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))
  ) {
    errors.push("email");
  }
  if (payload.gdpr_consent !== true) errors.push("gdpr");

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Campi obbligatori mancanti", fields: errors },
      { status: 422 }
    );
  }

  try {
    // Admin client come fallback se il client anon non riesce a INSERT
    // (Su RLS "anonymous/public can insert" basta anon, ma usiamo service_role
    //  per sicurezza e per poter fare .select() dell'admin dopo)
    const sb = createAdminClient() ?? createClient();

    // ----------------------------------------------------------------------
    // 1. Resolve nome tour_type se c'è l'ID (per il template email)
    // ----------------------------------------------------------------------
    let tourType: { id: string; name_it: string; name_en: string } | null = null;
    if (payload.tour_type_id && typeof payload.tour_type_id === "string") {
      const { data: tt } = await sb
        .from("tour_types")
        .select("id, name_it, name_en")
        .eq("id", payload.tour_type_id)
        .maybeSingle();
      if (tt) tourType = tt as any;
    }

    // ----------------------------------------------------------------------
    // 1b. Resolve slug trasporti validi (da tabella dinamica transport_modes)
    // ----------------------------------------------------------------------
    const validTransportSlugs: string[] = ["walk", "bike", "moto", "car", "bus"];
    try {
      const { data: tm } = await sb
        .from("transport_modes")
        .select("slug")
        .eq("is_active", true)
        .eq("is_available_for_booking", true);
      if (tm && tm.length > 0) {
        validTransportSlugs.length = 0;
        (tm as any[]).forEach((r) => validTransportSlugs.push(r.slug));
      }
    } catch {
      /* fallback a lista statica se la tabella non esiste ancora */
    }

    // ----------------------------------------------------------------------
    // 2. INSERT prenotazione
    // ----------------------------------------------------------------------
    const insert: BookingInsert = {
      full_name: String(payload.full_name).trim().slice(0, 200),
      email: String(payload.email).trim().slice(0, 200),
      phone: payload.phone
        ? String(payload.phone).trim().slice(0, 50)
        : null,
      tour_type_id: tourType ? tourType.id : (payload.tour_type_id ?? null),
      preferred_destination: payload.preferred_destination
        ? String(payload.preferred_destination).slice(0, 300)
        : null,
      preferred_date: payload.preferred_date || null,
      alternative_date: payload.alternative_date || null,
      participants:
        payload.participants != null && !isNaN(Number(payload.participants))
          ? Number(payload.participants)
          : null,
      visit_language:
        payload.visit_language === "it" || payload.visit_language === "en"
          ? payload.visit_language
          : null,
      transport:
        payload.transport && validTransportSlugs.includes(String(payload.transport))
          ? String(payload.transport)
          : null,
      notes: payload.notes
        ? String(payload.notes).slice(0, 5000)
        : null,
      gdpr_consent: true,
      status: "new",
    };

    const { data, error } = await (sb as any)
      .from("bookings")
      .insert([insert] as any)
      .select(
        `
        id,
        full_name,
        email,
        created_at,
        visit_language,
        preferred_date,
        preferred_destination,
        participants,
        tour_type_id
      `
      )
      .single();

    if (error) {
      console.error("[POST /api/bookings] Supabase INSERT error:", error);
      return NextResponse.json(
        {
          ok: false,
          error:
            error.code === "42501"
              ? "Errore autorizzazione (RLS o GRANTS mancanti) — esegui 000002_fix_grants_and_rls.sql su Supabase"
              : error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    const saved = data as any;

    // ----------------------------------------------------------------------
    // 3. CHIAMATA A EDGE FUNCTION "confirm-booking-received"
    //    Proviamo 2 target in ordine:
    //      a) NEXT_PUBLIC_SUPABASE_URL + /functions/v1/confirm-booking-received
    //         (la edge function DEPLOYATA su Supabase)
    //      b) Fallback: se l'utente sviluppa in locale e non ha deployato
    //         la edge function, saltiamo senza rompere la response
    // ----------------------------------------------------------------------
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const edgeFnBase = baseUrl ? baseUrl.replace(/\/+$/, "") + "/functions/v1" : null;

    // Payload condiviso tra le due edge functions
    const edgePayload = edgeFnBase ? {
      id: saved.id,
      full_name: saved.full_name ?? insert.full_name,
      email: saved.email ?? insert.email,
      phone: saved.phone ?? insert.phone ?? null,
      created_at: saved.created_at ?? new Date().toISOString(),
      visit_language:
        saved.visit_language ??
        insert.visit_language ??
        payload.visit_language ??
        "it",
      preferred_date: saved.preferred_date ?? insert.preferred_date,
      alternative_date: saved.alternative_date ?? insert.alternative_date ?? null,
      preferred_destination:
        saved.preferred_destination ?? insert.preferred_destination,
      participants: saved.participants ?? insert.participants,
      transport: saved.transport ?? insert.transport ?? null,
      notes: saved.notes ?? insert.notes ?? null,
      tour_type_name:
        (saved.visit_language ?? insert.visit_language) === "en"
          ? tourType?.name_en ?? null
          : tourType?.name_it ?? tourType?.name_en ?? null,
    } : null;

    let confirmStatus: { ok: boolean; email_sent: boolean; via?: string } = {
      ok: false,
      email_sent: false,
    };

    if (edgeFnBase && anonKey && edgePayload) {
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      };

      // 3a. Email di conferma al CLIENTE
      try {
        const r = await fetch(`${edgeFnBase}/confirm-booking-received`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(edgePayload),
          signal: AbortSignal.timeout(8000),
        });
        const rb = (await r.json().catch(() => ({}))) as any;
        confirmStatus = {
          ok: rb?.ok ?? false,
          email_sent: rb?.email_sent ?? false,
          via: "edge-function",
        };
        console.log("[POST /api/bookings] Edge fn confirm-booking-received", {
          status: r.status, confirmStatus,
        });
      } catch (e) {
        console.warn(
          "[POST /api/bookings] confirm-booking-received non raggiungibile — " +
            "deploya con: supabase functions deploy confirm-booking-received --no-verify-jwt",
          (e as Error).message
        );
      }

      // 3b. Email di notifica all'ADMIN (fire-and-forget — non blocca la response)
      fetch(`${edgeFnBase}/notify-new-booking`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(edgePayload),
        signal: AbortSignal.timeout(8000),
      })
        .then(async (r) => {
          const rb = await r.json().catch(() => ({}));
          console.log("[POST /api/bookings] Edge fn notify-new-booking", { status: r.status, rb });
        })
        .catch((e) => {
          console.warn(
            "[POST /api/bookings] notify-new-booking non raggiungibile — " +
              "deploya con: supabase functions deploy notify-new-booking --no-verify-jwt",
            (e as Error).message
          );
        });
    }

    return NextResponse.json({
      ok: true,
      id: saved?.id,
      created_at: saved?.created_at,
      confirm: confirmStatus,
    });
  } catch (err) {
    console.error("[POST /api/bookings] errore generico:", err);
    return NextResponse.json(
      { ok: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
