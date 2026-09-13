import { Suspense } from "react";
import { fetchPublicHomeData } from "@/lib/data/public";
import type { Lang } from "@/types/database.types";
import { LiveEditRoot } from "@/components/live-edit/LiveEditRoot";

import Header from "@/components/public/Header";
import HeroSection from "@/components/public/HeroSection";
import AboutSection from "@/components/public/AboutSection";
import SlowTourismBanner from "@/components/public/SlowTourismBanner";
import ToursSection from "@/components/public/ToursSection";
import EventsSection from "@/components/public/EventsSection";
import ExclusiveSection from "@/components/public/ExclusiveSection";
import ReviewsSection from "@/components/public/ReviewsSection";
import MediaSection from "@/components/public/MediaSection";
import BookingFormSection from "@/components/public/BookingFormSection";
import InfoSection from "@/components/public/InfoSection";
import QuoteSection from "@/components/public/QuoteSection";
import ContactsSection from "@/components/public/ContactsSection";
import Footer from "@/components/public/Footer";
import CvModal from "@/components/public/CvModal";

export default async function HomePage() {
  const data = await fetchPublicHomeData().catch((err) => {
    console.error(
      "[HomePage] ERRORE caricamento dati pubblici (hai collegato Supabase in .env.local?):",
      (err as Error).message
    );
    return null;
  });

  const profileId = (data?.profile as { id?: string } | null | undefined)?.id ?? null;

  return (
    <Suspense fallback={null}>
      <LiveEditRoot profileId={profileId}>
        <main className="min-h-screen bg-bg-main text-text-main font-sans">
          <Header />
          <HeroSection profile={data?.profile ?? null} />
          <AboutSection profile={data?.profile ?? null} cvItems={data?.cvItems ?? []} />
          <SlowTourismBanner />
          <ToursSection places={data?.places ?? []} tourTypes={data?.tourTypes ?? []} />
          <EventsSection events={data?.events ?? []} />
          <ExclusiveSection places={data?.places ?? []} tourTypes={data?.tourTypes ?? []} />
          <ReviewsSection reviews={data?.reviews ?? []} />
          <MediaSection media={data?.media ?? []} />
          <BookingFormSection tourTypes={data?.tourTypes ?? []} />
          <InfoSection items={data?.infoItems ?? []} />
          <QuoteSection quote={data?.quote ?? null} />
          <ContactsSection
            profile={data?.profile ?? null}
            contacts={((data?.profile as any)?.contacts as any[]) ?? []}
          />
          <Footer />
          <CvModal cvItems={data?.cvItems ?? []} />
        </main>
      </LiveEditRoot>
    </Suspense>
  );
}
