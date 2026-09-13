export interface BookingPrefillData {
  tourTypeId?: string;
  destination?: string;
  preferredDate?: string;
  participants?: number;
  notes?: string;
}

/**
 * Invia un evento custom per precompilare il form prenotazioni
 * ed esegue lo scroll fluido verso la sezione #prenota.
 */
export function triggerBookingPrefill(data: BookingPrefillData) {
  if (typeof window === "undefined") return;

  // 1. Dispatch custom window event
  window.dispatchEvent(
    new CustomEvent<BookingPrefillData>("davide:prefill-booking", {
      detail: data,
    })
  );

  // 2. Smooth scroll to #prenota con offset header
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
