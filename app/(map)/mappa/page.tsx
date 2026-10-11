import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { fetchHiddenSections, fetchPublicMapData } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { lang?: string };
}): Promise<Metadata> {
  const en = searchParams.lang === "en";
  const title = en ? "Places map" : "Mappa dei luoghi";
  const description = en
    ? "Explore guided-tour places, suggested destinations and reviews across Veneto and the province of Trento. Click the map to request a custom visit."
    : "Scopri i luoghi delle visite guidate, le mete proposte e le recensioni in Veneto e nella provincia di Trento. Clicca sulla mappa per richiedere una visita personalizzata.";
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Davide Apolloni`,
      description,
      locale: en ? "en_GB" : "it_IT",
    },
  };
}

const MapExplorer = dynamic(() => import("@/components/map/MapExplorer"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-[#7A6655]">
      Carico la mappa…
    </div>
  ),
});

export default async function MappaPage() {
  const hidden = await fetchHiddenSections().catch(() => ({} as Record<string, boolean>));
  if (hidden.mappa) {
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) notFound();
    } catch {
      notFound();
    }
  }

  const data = await fetchPublicMapData().catch((err) => {
    console.error("[/mappa]", (err as Error).message);
    return { places: [], allPlaces: [], spots: [], events: [], tourTypes: [], reviews: [] };
  });

  return (
    <MapExplorer
      places={data.places}
      allPlaces={data.allPlaces ?? data.places}
      spots={data.spots}
      events={data.events ?? []}
      tourTypes={data.tourTypes}
      reviews={data.reviews}
    />
  );
}
