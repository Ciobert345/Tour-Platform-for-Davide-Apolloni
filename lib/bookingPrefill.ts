export interface BookingPrefillData {
  tourTypeId?: string;
  destination?: string;
  preferredDate?: string;
  participants?: number;
  transport?: string;
  notes?: string;
  source?: "form" | "map";
  mapLat?: number | null;
  mapLng?: number | null;
  placeId?: string | null;
  mapSpotId?: string | null;
}

/**
 * Invia un evento custom per precompilare il form prenotazioni
 * ed esegue lo scroll fluido verso la sezione #prenota.
 */
export function triggerBookingPrefill(data: BookingPrefillData) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<BookingPrefillData>("davide:prefill-booking", {
      detail: data,
    })
  );

  setTimeout(() => {
    const el = document.getElementById("prenota");
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, 30);
}

export function readBookingQueryParams(search: string): BookingPrefillData | null {
  const p = new URLSearchParams(search);
  const dest = p.get("dest");
  const lat = p.get("lat");
  const lng = p.get("lng");
  const tour = p.get("tour");
  if (!dest && !lat && !lng && !tour) return null;
  const mapLat = lat != null && lat !== "" ? Number(lat) : undefined;
  const mapLng = lng != null && lng !== "" ? Number(lng) : undefined;
  return {
    destination: dest || undefined,
    tourTypeId: tour || undefined,
    mapLat: mapLat != null && Number.isFinite(mapLat) ? mapLat : undefined,
    mapLng: mapLng != null && Number.isFinite(mapLng) ? mapLng : undefined,
    source: mapLat != null && mapLng != null ? "map" : "form",
  };
}
