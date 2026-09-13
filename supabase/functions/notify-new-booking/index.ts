// Edge Function: notify-new-booking
// Invia email a Davide quando arriva una nuova prenotazione/richiesta
// Deploy: supabase functions deploy notify-new-booking --no-verify-jwt
//
// Secrets obbligatorie (Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY     — chiave privata Resend
//   RESEND_FROM        — es. "noreply@davideapolloni.it" (dominio verificato)
//   RESEND_FROM_NAME   — es. "Davide Apolloni Sito"
//   ADMIN_EMAIL        — la tua email personale (es. guidaturistica@davideapolloni.it)
//   SITE_URL           — opzionale, default https://davideapolloni.it

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};
const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "").trim();
}

function fmtDate(date: unknown): string {
  const raw = String(date ?? "").trim() || new Date().toISOString();
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) throw new Error("invalid");
    return d.toLocaleString("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return raw; }
}

// Parser payload robusto — stesso schema di confirm-booking-received
type RawPayload = Record<string, unknown> | null | undefined;
function extractRecord(raw: RawPayload): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  if (raw.type === "INSERT" && raw.record && typeof raw.record === "object")
    return raw.record as Record<string, unknown>;
  const ev = raw.event;
  if (ev && typeof ev === "object") {
    const evAny = ev as Record<string, unknown>;
    if (evAny.record && typeof evAny.record === "object") {
      const rec = evAny.record as Record<string, unknown>;
      if (rec.new && typeof rec.new === "object")
        return rec.new as Record<string, unknown>;
      return rec;
    }
  }
  const data = raw.data;
  if (data && typeof data === "object" &&
    typeof (data as Record<string, unknown>).email === "string")
    return data as Record<string, unknown>;
  if (typeof raw.email === "string") return raw as Record<string, unknown>;
  return raw as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST")
    return new Response(
      JSON.stringify({ ok: false, error: "Metodo non consentito" }),
      { status: 405, headers: JSON_HEADERS }
    );

  try {
    const rawPayload = await req.json().catch(() => ({}));
    const record = extractRecord(rawPayload);

    // Campi booking
    const full_name = stripHtml(record.full_name || record.name) || "—";
    const email = stripHtml(record.email || record.customer_email) || "—";
    const phone = stripHtml(record.phone) || "—";
    const booking_id = String(record.id ?? "—");
    const participants = record.participants ? Number(record.participants) : 0;
    const visit_language = stripHtml(record.visit_language) || "—";
    const preferred_date = record.preferred_date
      ? fmtDate(record.preferred_date).split(" ")[0]
      : "—";
    const alternative_date = record.alternative_date
      ? fmtDate(record.alternative_date).split(" ")[0]
      : null;
    const transport = (() => {
      const t = stripHtml(record.transport);
      const map: Record<string, string> = {
        walk: "A piedi", bike: "In bici",
        moto: "In moto", bus: "In autobus",
      };
      return t ? (map[t] ?? t) : "—";
    })();
    const destination = stripHtml(record.preferred_destination || record.destination) || "—";
    const notes = stripHtml(record.notes) || "";
    const tour_type_name =
      stripHtml((record.tour_type as Record<string, unknown> | undefined)?.name_it) ||
      stripHtml(record.tour_type_name) || "—";
    const created_at = fmtDate(record.created_at || new Date().toISOString());

    // Config
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "noreply@davideapolloni.it";
    const resendFromName = Deno.env.get("RESEND_FROM_NAME") || "Davide Apolloni Sito";
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "guidaturistica@davideapolloni.it";
    const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/+$/, "") || "https://davideapolloni.it";
    const adminPanelUrl = `${siteUrl}/admin/bookings`;

    if (!resendApiKey) {
      console.log("[notify-new-booking] RESEND_API_KEY non configurata — simulo invio", { to: adminEmail, booking_id });
      return new Response(
        JSON.stringify({ ok: true, simulated: true, booking_id }),
        { status: 202, headers: JSON_HEADERS }
      );
    }

    const subject = `🔔 Nuova richiesta da ${full_name} — Davide Apolloni`;
    const html = buildAdminHtml({
      full_name, email, phone, booking_id, participants,
      visit_language, preferred_date, alternative_date,
      transport, destination, notes, tour_type_name, created_at,
      adminEmail, adminPanelUrl, siteUrl,
    });

    let email_sent = false;
    let resend_id: string | null = null;
    let provider_error: string | null = null;

    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: `${resendFromName} <${resendFrom}>`,
        to: [adminEmail],
        reply_to: email !== "—" ? email : undefined,
        subject,
        html,
        tags: [
          { name: "tipo", value: "admin-notify" },
          { name: "booking_id", value: booking_id.slice(0, 50) },
        ],
      });
      if (error) {
        provider_error = String(error?.message ?? JSON.stringify(error));
        console.error("[notify-new-booking] Resend error", provider_error);
      } else {
        email_sent = true;
        resend_id = data?.id ?? null;
        console.log("[notify-new-booking] Email inviata", { to: adminEmail, booking_id, resend_id });
      }
    } catch (mailErr) {
      provider_error = String((mailErr as Error)?.message ?? "unknown");
      console.error("[notify-new-booking] Eccezione Resend", provider_error);
      // Fallback fetch diretto
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${resendFromName} <${resendFrom}>`,
            to: [adminEmail],
            reply_to: email !== "—" ? email : undefined,
            subject, html,
          }),
        });
        if (r.ok) {
          const body = await r.json().catch(() => ({}));
          email_sent = true;
          resend_id = String((body as { id?: string }).id ?? "");
          provider_error = null;
          console.log("[notify-new-booking] Email inviata (fallback)", { to: adminEmail, resend_id });
        } else {
          const body = await r.text().catch(() => "");
          console.error("[notify-new-booking] Fallback fallito", { status: r.status, body: body.slice(0, 300) });
        }
      } catch (fbErr) {
        console.error("[notify-new-booking] Fallback eccezione:", (fbErr as Error)?.message);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, email_sent, resend_id, booking_id, provider_error }),
      { status: email_sent ? 200 : 202, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[notify-new-booking] ERRORE GENERALE:", err);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error)?.message ?? "Internal server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});

// =============================================================================
// TEMPLATE EMAIL ADMIN — design coerente con il sito
// =============================================================================
type AdminEmailArgs = {
  full_name: string;
  email: string;
  phone: string;
  booking_id: string;
  participants: number;
  visit_language: string;
  preferred_date: string;
  alternative_date: string | null;
  transport: string;
  destination: string;
  notes: string;
  tour_type_name: string;
  created_at: string;
  adminEmail: string;
  adminPanelUrl: string;
  siteUrl: string;
};

function row(label: string, value: string, highlight = false): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #dec5a5;width:38%;vertical-align:top;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#72553f;">${label}</span>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #dec5a5;vertical-align:top;">
      <span style="font-size:14px;font-weight:600;color:${highlight ? "#93161a" : "#2A2725"};">${value}</span>
    </td>
  </tr>`;
}

function buildAdminHtml(a: AdminEmailArgs): string {
  const langLabel: Record<string, string> = {
    it: "🇮🇹 Italiano",
    en: "🇬🇧 Inglese",
    de: "🇩🇪 Tedesco",
    fr: "🇫🇷 Francese",
    es: "🇪🇸 Spagnolo",
  };

  const participantsStr = a.participants > 0 ? `${a.participants} persone` : "—";
  const langStr = langLabel[a.visit_language.toLowerCase()] ?? a.visit_language;
  const altDateRow = a.alternative_date
    ? row("Data alternativa", a.alternative_date)
    : "";
  const notesBlock = a.notes
    ? `<div style="margin-top:20px;padding:16px 20px;background:#ede1ca;border-left:4px solid #93161a;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#72553f;">Note del cliente</p>
        <p style="margin:0;font-size:14px;color:#2A2725;line-height:1.7;white-space:pre-wrap;">${a.notes}</p>
      </div>`
    : "";

  return `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Nuova richiesta — ${a.full_name}</title></head>
<body style="margin:0;padding:0;background:#f9f5ec;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f5ec;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;">

  <!-- Header -->
  <tr><td style="background:#93161a;padding:28px 32px;border-radius:14px 14px 0 0;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Nuova richiesta dal sito</p>
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">${a.full_name}</h1>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Ricevuta il ${a.created_at} &nbsp;·&nbsp; ID: <code style="font-family:Consolas,monospace;font-size:12px;">${a.booking_id.slice(0, 8)}…</code></p>
  </td></tr>

  <!-- Quick contact bar -->
  <tr><td style="background:#3F2E27;padding:14px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td><a href="mailto:${a.email}" style="color:#dec5a5;font-size:13px;font-weight:600;text-decoration:none;">✉ ${a.email}</a></td>
<td align="right"><a href="tel:${a.phone.replace(/\s/g, "")}" style="color:#dec5a5;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${a.phone}</a></td>    </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fffdf9;padding:28px 32px;border-radius:0 0 14px 14px;border:1px solid #ede1ca;border-top:0;">

    <!-- Dettagli richiesta -->
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#72553f;">Dettagli richiesta</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
      ${row("Tipo di tour", a.tour_type_name)}
      ${row("Destinazione", a.destination)}
      ${row("Data preferita", a.preferred_date, true)}
      ${altDateRow}
      ${row("Partecipanti", participantsStr)}
      ${row("Lingua visita", langStr)}
      ${row("Trasporto", a.transport)}
    </table>

    ${notesBlock}

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
    <tr>
      <td style="padding-right:8px;">
<a href="${a.adminPanelUrl}" style="display:flex;align-items:center;justify-content:center;width:100%;padding:13px 20px;background:#482e21;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;box-sizing:border-box;">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
  Apri pannello admin
</a>
      </td>
      <td style="padding-left:8px;">
        <a href="mailto:${a.email}?subject=Re: Richiesta tour ${a.tour_type_name}&body=Gentile ${a.full_name},%0A%0A" style="display:block;text-align:center;padding:13px 20px;background:#93161a;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;">
          ✉ Rispondi al cliente
        </a>
      </td>
    </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;line-height:1.6;">
      Email automatica dal sito <a href="${a.siteUrl}" style="color:#93161a;text-decoration:none;">${a.siteUrl.replace(/^https?:\/\//, "")}</a><br>
      Non rispondere a questa email — usa il pulsante qui sopra.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
