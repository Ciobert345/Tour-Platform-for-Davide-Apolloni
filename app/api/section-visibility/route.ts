import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/section-visibility
 * Returns all section visibility settings as { [sectionId]: boolean (true = visible) }
 */
export async function GET() {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("ui_strings")
      .select("key, it")
      .like("key", "section.hidden.%");

    if (error) throw error;

    const result: Record<string, boolean> = {};
    for (const row of (data ?? []) as any[]) {
      const sectionId = (row.key as string).replace("section.hidden.", "");
      result[sectionId] = row.it !== "true";
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/section-visibility
 * Body: { sectionId: string, hidden: boolean }
 * Saves the section visibility to ui_strings table.
 */
export async function POST(req: NextRequest) {
  try {
    const { sectionId, hidden } = await req.json();
    if (!sectionId || typeof hidden !== "boolean") {
      return NextResponse.json({ error: "sectionId and hidden (boolean) required" }, { status: 400 });
    }

    const sb = createClient();
    const key = `section.hidden.${sectionId}`;

    const { error } = await (sb
      .from("ui_strings") as any)
      .upsert(
        { key, it: hidden ? "true" : "false", en: hidden ? "true" : "false" },
        { onConflict: "key" }
      );

    if (error) throw error;

    return NextResponse.json({ ok: true, sectionId, hidden });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
