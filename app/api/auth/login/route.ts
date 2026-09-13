import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido" }, { status: 400 });
  }
  const email = String(payload?.email ?? "").trim();
  const password = String(payload?.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email e password obbligatorie" },
      { status: 422 }
    );
  }

  try {
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Credenziali non valide" },
        { status: 401 }
      );
    }
    // Controllo ruolo admin (claim opzionale — funzione is_admin non è disponibile via Auth)
    return NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}
