// Edge Function: confirm-booking-received
// -----------------------------------------------------------------------------
// Invia email di CONFERMA RICEZIONE all'UTENTE che ha compilato il form
// prenotazioni sul sito, con copia BCC all'indirizzo amministrativo.
//
// Trigger supportati:
//   1. Webhook Supabase DB (evento INSERT su public.bookings)
//      - Dashboard native:  { type, table, schema, record, old_record }
//      - pg_net wrapper:    { event: { ...record: { new: {...} } } }
//   2. Chiamata HTTP POST diretta (es. da /app/api/bookings/route.ts)
//
// Deploy:
//   supabase functions deploy confirm-booking-received --no-verify-jwt
//
// Secrets obbligatorie (Imposta da Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY     — chiave privata Resend
//   RESEND_FROM        — es. "noreply@davideapolloni.it" (dominio verificato)
//   RESEND_FROM_NAME   — es. "Davide Apolloni Guida Turistica"
//   ADMIN_EMAIL        — email amministrativa in BCC / reply-to
//   SITE_URL           — opzionale, default https://davideapolloni.it
// -----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";

// ---------------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------------
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeUuid(): string {
  try {
    // deno-lint-ignore no-explicit-any
    const g = (globalThis as any).crypto;
    if (g && typeof g.randomUUID === "function") return g.randomUUID();
  } catch {
    /* noop */
  }
  return `bk_` + Math.random().toString(36).slice(2, 10);
}

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "").trim();
}

function fmtDate(date: unknown, locale: "it-IT" | "en-GB"): string {
  const raw = String(date ?? "").trim() || new Date().toISOString();
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) throw new Error("invalid");
    return d.toLocaleString(locale, {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Parser payload robusto — gestisce TUTTI i formati noti Supabase
// ---------------------------------------------------------------------------
type RawPayload = Record<string, unknown> | null | undefined;

function extractRecord(raw: RawPayload): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};

  // 1) Formato nativo Supabase Dashboard
  if (raw.type === "INSERT" && raw.record && typeof raw.record === "object") {
    return raw.record as Record<string, unknown>;
  }
  // 2) Formato pg_net / eventi con wrapper `event.record.new`
  const ev = raw.event;
  if (ev && typeof ev === "object") {
    const evAny = ev as Record<string, unknown>;
    if (
      evAny.record && typeof evAny.record === "object" &&
      (evAny.record as Record<string, unknown>).new &&
      typeof (evAny.record as Record<string, unknown>).new === "object"
    ) {
      return (evAny.record as Record<string, unknown>).new as Record<string, unknown>;
    }
    if (evAny.record && typeof evAny.record === "object") {
      return evAny.record as Record<string, unknown>;
    }
    if (
      evAny.data && typeof evAny.data === "object" &&
      (evAny.data as Record<string, unknown>).new &&
      typeof (evAny.data as Record<string, unknown>).new === "object"
    ) {
      return (evAny.data as Record<string, unknown>).new as Record<string, unknown>;
    }
  }
  // 3) Wrapper pg_net o API route: { data: { ...booking } }
  const data = raw.data;
  if (
    data && typeof data === "object" &&
    typeof (data as Record<string, unknown>).email === "string"
  ) {
    return data as Record<string, unknown>;
  }
  // 4) Chiamata diretta (payload piatto che contiene almeno email)
  if (typeof raw.email === "string") return raw as Record<string, unknown>;

  return raw as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Servizio
// ---------------------------------------------------------------------------
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  // Health / reachability
  if (req.method === "HEAD") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Metodo non consentito" }),
      { status: 405, headers: JSON_HEADERS }
    );
  }

  try {
    const rawPayload = await req.json().catch(() => ({}));
    const record = extractRecord(rawPayload);

    // Campi prenotazione — alias multipli per retro-compatibilità
    const full_name =
      stripHtml(record.full_name) ||
      stripHtml(record.name) ||
      stripHtml(record.customer_name) ||
      "Ospite";
    const email =
      stripHtml(record.email) ||
      stripHtml(record.customer_email) ||
      "";
    let booking_id = String(record.id ?? "").trim();
    if (!booking_id || !UUID_RE.test(booking_id)) booking_id = safeUuid();
    const created_at = String(record.created_at ?? new Date().toISOString());
    const langRaw =
      (String(record.visit_language ?? record.language ?? "it")).toLowerCase();
    const lang = langRaw.startsWith("en") ? "en" : "it";
    const participants = Number(record.participants) || 0;
    const destination = stripHtml(record.preferred_destination || record.destination);
    const preferred_date = record.preferred_date ? String(record.preferred_date) : "";
    const tour_type_name =
      stripHtml((record.tour_type as Record<string, unknown> | undefined)?.name_it) ||
      stripHtml(record.tour_type_name) ||
      "";

    // Validazione email base
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn(
        "[confirm-booking-received] email mancante o non valida",
        { raw_keys: Object.keys(rawPayload), rec_keys: Object.keys(record) }
      );
      return new Response(
        JSON.stringify({ ok: false, error: "Email mancante o non valida" }),
        { status: 422, headers: JSON_HEADERS }
      );
    }

    // Secrets / configadminEmail
    const siteUrl =
      Deno.env.get("SITE_URL")?.replace(/\/+$/, "") ||
      "https://davideapolloni.it";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom =
      Deno.env.get("RESEND_FROM") || "noreply@davideapolloni.it";
    const resendFromName =
      Deno.env.get("RESEND_FROM_NAME") ||
      "Davide Apolloni Guida Turistica Autorizzata";
    const adminEmail =
      Deno.env.get("ADMIN_EMAIL") || "guidaturistica@davideapolloni.it";

    const subject =
      lang === "en"
        ? "Your tour request has been received — Davide Apolloni"
        : "Richiesta ricevuta correttamente — Davide Apolloni";
    const html =
      lang === "en"
        ? buildHtmlEn({
            name: full_name, booking_id, date: created_at, siteUrl,
            adminEmail, participants, destination, preferred_date,
            tour_type_name,
          })
        : buildHtmlIt({
            name: full_name, booking_id, date: created_at, siteUrl,
            adminEmail, participants, destination, preferred_date,
            tour_type_name,
          });

    let email_sent = false;
    let provider_error: string | null = null;
    let resend_id: string | null = null;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const payload = {
          from: `${resendFromName} <${resendFrom}>`,
          to: [email],
          //bcc: [adminEmail],
          reply_to: adminEmail,
          subject,
          html,
          tags: [
            { name: "tipo", value: "booking-confirm" },
            { name: "lang", value: lang },
            { name: "booking_id", value: booking_id },
          ],
        };
        const { data, error } = await resend.emails.send(payload);
        if (error) {
          provider_error = String(error?.message ?? JSON.stringify(error));
          console.error(
            "[confirm-booking-received] Resend SDK error",
            { status: (error as { statusCode?: number }).statusCode,
              message: provider_error
            }
          );
        } else {
          email_sent = true;
          resend_id = data?.id ?? null;
          console.log(
            "[confirm-booking-received] Email inviata (Resend SDK)",
            { to: email, booking_id, resend_id }
          );
        }
      } catch (mailErr) {
        provider_error = String((mailErr as Error)?.message ?? "unknown");
        console.error(
          "[confirm-booking-received] Eccezione SDK Resend — provo fallback fetch",
          provider_error
        );

        // Fallback: fetch diretto all'API di Resend
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${resendFromName} <${resendFrom}>`,
              to: [email],
              //bcc: [adminEmail],
              reply_to: adminEmail,
              subject,
              html,
            }),
          });
          if (r.ok) {
            const body = await r.json().catch(() => ({}));
            email_sent = true;
            provider_error = null;
            resend_id = String((body as { id?: string }).id ?? "");
            console.log(
              "[confirm-booking-received] Email inviata (fallback fetch)",
              { to: email, booking_id, resend_id }
            );
          } else {
            const body = await r.text().catch(() => "");
            console.error(
              "[confirm-booking-received] Fallback fetch fallito",
              { status: r.status, body: body.slice(0, 300) }
            );
          }
        } catch (fbErr) {
          console.error(
            "[confirm-booking-received] Fallback fetch eccezione:",
            (fbErr as Error)?.message ?? fbErr
          );
        }
      }
    } else {
      console.log(
        "[confirm-booking-received] RESEND_API_KEY non configurata — simulo invio",
        { to: email, booking_id, lang }
      );
    }

    const status =
      email_sent ? 200 : resendApiKey ? 202 : 202;
    return new Response(
      JSON.stringify({
        ok: true,
        booking_id,
        to: email,
        lang,
        email_sent,
        resend_id,
        provider_error,
      }),
      { status, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[confirm-booking-received] ERRORE GENERALE:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: (err as Error)?.message ?? "Internal server error",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});

// =============================================================================
// TEMPLATE EMAIL
// =============================================================================
type EmailArgs = {
  name: string;
  booking_id: string;
  date: string;
  siteUrl: string;
  adminEmail: string;
  participants?: number;
  destination?: string;
  preferred_date?: string;
  tour_type_name?: string;
};

// -----------------------------------------------------------------------------
// ITALIANO
// -----------------------------------------------------------------------------
function buildHtmlIt(a: EmailArgs): string {
  const dataFormattata = fmtDate(a.date, "it-IT");
  const dataPrenotazione = a.preferred_date
    ? fmtDate(a.preferred_date, "it-IT").split(" ")[0]
    : "da definire";
  const partecipanti = (a.participants ?? 0) > 0 ? `${a.participants} pax` : "—";
  const linkTour = `${a.siteUrl}/#tour`;
  const linkInfo = `${a.siteUrl}/#info`;
  const linkContatti = `${a.siteUrl}/#contatti`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Richiesta Ricevuta — Davide Apolloni</title></head><body style="margin:0;padding:0;background:#f9f5ec;font-family:'Helvetica Neue',Arial,sans-serif;color:#2b2018;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f5ec;">
  <tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
  <tr><td style="background:#241a12;color:#f7f0e3;padding:28px 32px;border-radius:14px 14px 0 0;">
    <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-style:italic;line-height:1.35;font-weight:400;">
      Una buona guida non recita una lezione: cammina accanto a voi.
    </h1>
  </td></tr>
  <tr><td style="padding:32px;background:#fffdf9;border-radius:0 0 14px 14px;border:1px solid #dec5a5;border-top:0;">
    <p style="font-size:17px;margin:0 0 8px;">Gentile <strong style="color:#93161a;">${a.name}</strong>,</p>
    <p style="font-size:16px;line-height:1.65;color:#2b2018;margin:0 0 22px;">
      grazie per avermi contattato! La tua richiesta &egrave; stata ricevuta
      <strong>correttamente</strong> e ti risponder&ograve; personalmente
      entro <strong>24&ndash;48 ore</strong> via email con un preventivo dettagliato
      e tutte le informazioni di cui hai bisogno.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:18px 20px;background:#ede1ca;border-radius:10px;margin-bottom:26px;border-left:4px solid #93161a;">
      <tr>
        <td width="40%" style="padding:4px 0 12px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">ID Richiesta</p></td>
        <td width="60%" style="padding:4px 0 12px 0;"><p style="margin:0;font-size:15px;font-weight:700;font-family:Consolas,'Courier New',monospace;color:#2b2018;word-break:break-all;">${a.booking_id}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Data invio</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${dataFormattata}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Itinerario</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${a.tour_type_name || "Richiesta personalizzata"}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Destinazione</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${a.destination || "—"}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Data preferita</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${dataPrenotazione}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Partecipanti</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${partecipanti}</p></td>
      </tr>
    </table>
    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">
      Nel frattempo, puoi trovare ispirazione dagli
      <a href="${linkTour}" style="color:#93161a;font-weight:600;text-decoration:none;border-bottom:1px solid #93161a;">itinerari pubblicati</a>
      o consultare la sezione <a href="${linkInfo}" style="color:#93161a;font-weight:600;text-decoration:none;border-bottom:1px solid #93161a;">FAQ</a>
      per informazioni su cancellazioni, zona operativa e lingue disponibili.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 8px;">
      <tr><td align="center">
        <a href="${linkContatti}" style="display:inline-block;padding:14px 28px;background:#93161a;color:#ffffff;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(147,22,26,0.25);">
          Scrivimi direttamente
        </a>
      </td></tr>
    </table>
    <p style="margin:28px 0 0;color:#72553f;font-size:14px;line-height:1.6;">
      A presto,<br>
      <strong style="color:#2b2018;font-family:Georgia,serif;font-size:19px;">Davide Apolloni</strong><br>
      <span style="font-size:12px;">Guida Turistica Autorizzata &middot; Accompagnatore Turistico</span><br>
      <a href="mailto:${a.adminEmail}" style="font-size:12px;color:#93161a;text-decoration:none;">${a.adminEmail}</a><br>
      <a href="${a.siteUrl}" style="font-size:12px;color:#93161a;text-decoration:none;">${a.siteUrl.replace(/^https?:\/\//, "")}</a>
    </p>
  </td></tr></table></td></tr></table></body></html>`;
}

// -----------------------------------------------------------------------------
// INGLESE
// -----------------------------------------------------------------------------
function buildHtmlEn(a: EmailArgs): string {
  const dataFormattata = fmtDate(a.date, "en-GB");
  const dataPrenotazione = a.preferred_date
    ? fmtDate(a.preferred_date, "en-GB").split(" ")[0]
    : "to be agreed";
  const partecipanti = (a.participants ?? 0) > 0 ? `${a.participants} pax` : "—";
  const linkTour = `${a.siteUrl}/#tour`;
  const linkInfo = `${a.siteUrl}/#info`;
  const linkContatti = `${a.siteUrl}/#contatti`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Request Received — Davide Apolloni</title></head><body style="margin:0;padding:0;background:#f9f5ec;font-family:'Helvetica Neue',Arial,sans-serif;color:#2b2018;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f5ec;">
  <tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
  <tr><td style="background:#241a12;color:#f7f0e3;padding:28px 32px;border-radius:14px 14px 0 0;">
    <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-style:italic;line-height:1.35;font-weight:400;">
      A good guide doesn't recite a lesson: they walk beside you.
    </h1>
  </td></tr>
  <tr><td style="padding:32px;background:#fffdf9;border-radius:0 0 14px 14px;border:1px solid #dec5a5;border-top:0;">
    <p style="font-size:17px;margin:0 0 8px;">Dear <strong style="color:#93161a;">${a.name}</strong>,</p>
    <p style="font-size:16px;line-height:1.65;color:#2b2018;margin:0 0 22px;">
      thank you for getting in touch! Your request has been
      <strong>successfully received</strong> and I will personally reply
      within <strong>24&ndash;48 hours</strong> with a detailed quote and all
      the information you need.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:18px 20px;background:#ede1ca;border-radius:10px;margin-bottom:26px;border-left:4px solid #93161a;">
      <tr>
        <td width="40%" style="padding:4px 0 12px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Request ID</p></td>
        <td width="60%" style="padding:4px 0 12px 0;"><p style="margin:0;font-size:15px;font-weight:700;font-family:Consolas,'Courier New',monospace;color:#2b2018;word-break:break-all;">${a.booking_id}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Sent on</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${dataFormattata}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Tour type</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${a.tour_type_name || "Custom request"}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Destination</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${a.destination || "—"}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Preferred date</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${dataPrenotazione}</p></td>
      </tr>
      <tr>
        <td style="padding:4px 0;"><p style="margin:0;font-size:12px;color:#72553f;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Participants</p></td>
        <td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#2b2018;">${partecipanti}</p></td>
      </tr>
    </table>
    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">
      In the meantime, you can browse the
      <a href="${linkTour}" style="color:#93161a;font-weight:600;text-decoration:none;border-bottom:1px solid #93161a;">published itineraries</a>
      or check the <a href="${linkInfo}" style="color:#93161a;font-weight:600;text-decoration:none;border-bottom:1px solid #93161a;">FAQ section</a>
      for cancellation policy, operating area and available languages.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 8px;">
      <tr><td align="center">
        <a href="${linkContatti}" style="display:inline-block;padding:14px 28px;background:#93161a;color:#ffffff;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(147,22,26,0.25);">
          Email me directly
        </a>
      </td></tr>
    </table>
    <p style="margin:28px 0 0;color:#72553f;font-size:14px;line-height:1.6;">
      See you soon,<br>
      <strong style="color:#2b2018;font-family:Georgia,serif;font-size:19px;">Davide Apolloni</strong><br>
      <span style="font-size:12px;">Authorized Tour Guide &middot; Licensed Tour Leader</span><br>
      <a href="mailto:${a.adminEmail}" style="font-size:12px;color:#93161a;text-decoration:none;">${a.adminEmail}</a><br>
      <a href="${a.siteUrl}" style="font-size:12px;color:#93161a;text-decoration:none;">${a.siteUrl.replace(/^https?:\/\//, "")}</a>
    </p>
  </td></tr></table></td></tr></table></body></html>`;
}
