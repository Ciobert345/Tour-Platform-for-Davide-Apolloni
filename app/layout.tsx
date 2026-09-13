import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider, FALLBACK_STRINGS } from "@/lib/i18n/LanguageProvider";
import { fetchUiStrings } from "@/lib/data/public";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Davide Apolloni | Guida Turistica Autorizzata - Veneto e Trentino",
    template: "%s · Davide Apolloni",
  },
  description:
    "Sito ufficiale di Davide Apolloni: Guida Turistica Autorizzata, Accompagnatore Turistico e Professore di Lettere e Storia. Visite guidate a Venezia, Padova, Vicenza, Ville Palladiane, Castelli Trentini e Luoghi della Grande Guerra.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://davideapolloni.it"
  ),
  openGraph: {
    type: "website",
    title: "Davide Apolloni | Guida Turistica Autorizzata",
    description:
      "Guida Turistica Autorizzata e Accompagnatore Turistico. Itinerari su misura tra Veneto e Trentino: Ville Palladiane, Città d'Arte, Castelli e Luoghi della Grande Guerra.",
    locale: "it_IT",
  },
  keywords: [
    "Guida turistica Veneto", "Guida turistica Trentino", "Davide Apolloni",
    "Ville Palladiane", "Venezia", "Padova", "Vicenza",
    "Grande Guerra 1915-1918", "Asiago", "Castelli Trentini",
    "Slow tourism", "Tour su misura",
  ],
};

export const revalidate = 300; // ISR ogni 5 minuti

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Carica le UI strings lato server e le passa al provider
  // Se fallisce (DB non ancora connesso), usa i fallback hardcoded
  let uiStrings: { key: string; it: string; en: string }[] = Object.entries(
    FALLBACK_STRINGS
  ).map(([key, v]) => ({ key, it: v.it, en: v.en }));
  try {
    const fromDb = await fetchUiStrings();
    if (fromDb && fromDb.length > 0) uiStrings = fromDb;
  } catch (err) {
    console.warn(
      "[RootLayout] Impossibile caricare ui_strings da Supabase (DB collegato?); uso fallback hardcoded. Errore:",
      (err as Error).message
    );
  }

  return (
    <html lang="it" suppressHydrationWarning className="overflow-x-clip">
      <body className="antialiased bg-bg-main overflow-x-clip w-full max-w-[100vw]">
        <LanguageProvider initialStrings={uiStrings}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}