import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pulisci il nome del file e aggiungi timestamp univoco
    const originalName = file.name || "upload";
    const ext = path.extname(originalName) || ".jpg";
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);
    const filename = `${baseName}-${Date.now()}${ext}`;

    // 1. Prova caricamento su Supabase Storage se disponibile (necessario per Netlify e hosting serverless)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);

        // Assicurati che il bucket "media" esista e sia pubblico
        const { data: buckets } = await supabase.storage.listBuckets();
        const hasMediaBucket = buckets?.some((b) => b.name === "media");
        if (!hasMediaBucket) {
          await supabase.storage.createBucket("media", {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
        }

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("media")
          .upload(`uploads/${filename}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("media")
            .getPublicUrl(`uploads/${filename}`);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              filename,
              storage: "supabase",
              size: file.size,
              type: file.type,
            });
          }
        }
      } catch (e) {
        console.warn("Supabase storage fallback:", e);
      }
    }

    // 2. Storage Locale: salva in `public/uploads` e in `uploads/`
    const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
    const uploadsDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicUploadsDir, filename), buffer);
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename,
      storage: "local",
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("Errore upload file:", error);
    return NextResponse.json(
      { error: error?.message || "Errore durante il caricamento del file" },
      { status: 500 }
    );
  }
}
