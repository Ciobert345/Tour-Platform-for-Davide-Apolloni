"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import BookingFormSection from "@/components/public/BookingFormSection";
import type { BookingMapContext } from "@/components/map/MapExplorer";
import type { Database } from "@/types/database.types";
import { X } from "lucide-react";

export default function MapBookingDrawer({
  context,
  tourTypes,
  onClose,
}: {
  context: BookingMapContext;
  tourTypes: Database["public"]["Tables"]["tour_types"]["Row"][];
  onClose: () => void;
}) {
  const t = useT();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-[#1E160A]/70 backdrop-blur-sm cursor-pointer transition-opacity"
        aria-label={t("map.close", "Chiudi")}
        onClick={onClose}
      />

      {/* Modal Dialog container: max-w-5xl ensures the 12-column 2-panel layout renders identically to the main site */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-book-title"
        className="relative w-full max-w-5xl my-auto z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Floating Close button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#2b2218] text-[#1E160A] dark:text-[#fdf9f2] shadow-xl border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-[#9C1C1C] hover:text-white dark:hover:bg-[#9C1C1C] transition-all cursor-pointer"
          aria-label={t("map.close", "Chiudi")}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Embedded BookingFormSection (renders the exact two-panel card from the homepage) */}
        <div className="w-full shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <BookingFormSection
            tourTypes={tourTypes}
            embedMode={true}
            initialPrefill={{
              destination: context.destination,
              tourTypeId: context.tourTypeId ?? undefined,
              source: "map",
              mapLat: context.mapLat,
              mapLng: context.mapLng,
              placeId: context.placeId,
              mapSpotId: context.mapSpotId,
            }}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
