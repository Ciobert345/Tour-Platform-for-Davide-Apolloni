// Edge Function: notify-review-pending
// Notifica a Davide che c'è una nuova recensione in attesa di approvazione
// Deploy: supabase functions deploy notify-review-pending --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { review_id, author_name, author_location, review_text, rating, submitted_at } = payload;

    // Resend / SMTP (stesso pattern delle altre funzioni)
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // await resend.emails.send({
    //   from: "Davide Apolloni Sito <noreply@davideapolloni.it>",
    //   to: [Deno.env.get("ADMIN_EMAIL")!],
    //   subject: `⭐ Nuova recensione in attesa da ${author_name}`,
    //   html: `
    //     <div style="font-family:sans-serif;padding:32px;max-width:560px;color:#2A2725;">
    //       <h2 style="margin:0 0 8px;color:#93161a;">⭐ Recensione in attesa di moderazione</h2>
    //       <p style="margin:0 0 20px;color:#72553f;">ID: ${review_id}</p>
    //       <div style="background:#fffdf9;border-radius:12px;padding:24px;border:1px solid rgba(42,39,37,0.08);">
    //         <p style="margin:0 0 4px;font-size:22px;color:#E6B800;letter-spacing:2px;">${stars(rating ?? 0)}</p>
    //         <blockquote style="margin:0 0 16px;padding:12px 16px;background:#ede1ca;border-left:3px solid #93161a;color:#2b2018;font-style:italic;line-height:1.6;">
    //           ${review_text}
    //         </blockquote>
    //         <p style="margin:0;font-size:14px;">
    //           <strong>${author_name}</strong>
    //           ${author_location ? ` · <span style="color:#72553f;">${author_location}</span>` : ""}
    //           <br><span style="color:#72553f;font-size:12px;">Inviata il ${new Date(submitted_at).toLocaleString("it-IT")}</span>
    //         </p>
    //       </div>
    //       <p style="margin-top:24px;">
    //         <a href="https://supabase.com/dashboard/project/_/editor?schema=public&table=reviews"
    //            style="background:#482e21;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
    //           Moderala nel pannello admin →
    //         </a>
    //       </p>
    //     </div>`,
    // });

    console.log("[notify-review-pending] Notifica admin recensione:", review_id, author_name, stars(rating ?? 0));

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[notify-review-pending] ERRORE:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
