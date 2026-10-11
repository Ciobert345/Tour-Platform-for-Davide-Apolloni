"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import BookingForm from "@/components/public/BookingForm";
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
    <div className="fixed inset-0 z-[2000] flex justify-end">
      <button type="button" className="absolute inset-0 bg-[#1E160A]/40" aria-label={t("map.close")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-book-title"
        className="relative w-full md:max-w-lg h-full bg-[#FAF4EB] dark:bg-[#1a140f] shadow-2xl overflow-y-auto p-5 sm:p-7"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="map-book-title" className="font-serif text-2xl">{t("map.drawerTitle")}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-md hover:bg-black/5" aria-label={t("map.close")}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <BookingForm
          tourTypes={tourTypes}
          listenGlobalPrefill={false}
          idPrefix="map-book"
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
  );
}
