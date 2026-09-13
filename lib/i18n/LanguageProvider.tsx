"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Lang } from "@/types/database.types";

type UiStringsMap = Record<string, { it: string; en: string }>;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Restituisce la stringa localizzata data la chiave UI */
  t: (key: string, fallback?: string) => string;
  /** Tutte le stringhe caricate (chiave -> { it, en }) */
  strings: UiStringsMap;
  /** Stato loading iniziale */
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const DEFAULT_LANG: Lang = (process.env.NEXT_PUBLIC_DEFAULT_LANG as Lang) || "it";

// Fallback hardcoded — usato mentre si caricano le stringhe dal DB
// (stesse chiavi di ui_strings in SQL)
export const FALLBACK_STRINGS: UiStringsMap = {
  "nav.subtitle": { it: "Guida Turistica Autorizzata", en: "Authorized Tour Guide" },
  "nav.about": { it: "Chi sono", en: "About Me" },
  "nav.tours": { it: "Itinerari", en: "Tours" },
  "nav.experiences": { it: "Esperienze", en: "Experiences" },
  "nav.exclusive": { it: "Esperienze", en: "Exclusive" },
  "nav.ww1": { it: "Grande Guerra", en: "World War I" },
  "nav.media": { it: "Galleria", en: "Gallery" },
  "nav.reviews": { it: "Recensioni", en: "Reviews" },
  "nav.info": { it: "FAQ", en: "FAQ" },
  "nav.faq": { it: "FAQ", en: "FAQ" },
  "nav.contacts": { it: "Contatti", en: "Contact" },
  "nav.book": { it: "Prenota", en: "Book Now" },
  "nav.contactCta": { it: "Richiedi una Visita", en: "Request a Visit" },
  "hero.badge": { it: "Professore di Lettere & Storia • Specialista in Storia dell'Arte", en: "Professor of Literature & History • Art History Specialist" },
  "hero.title": { it: "Scopri Veneto & Trentino con una Guida Turistica Autorizzata", en: "Discover Veneto & Trentino with an Authorized Tour Guide" },
  "hero.desc": { it: "Itinerari culturali ed eleganti condotti da un professore di storia dell'arte ed esperto del territorio.", en: "Elegant cultural itineraries led by an Art History Professor and local expert." },
  "hero.feat1": { it: "Città d'Arte: Venezia, Padova, Vicenza, Trento, Bolzano", en: "Art Cities: Venice, Padua, Vicenza, Trent, Bolzano" },
  "hero.feat2": { it: "Ville Palladiane & Dimore Storiche del Brenta", en: "Palladian Villas & Riviera del Brenta Estates" },
  "hero.feat3": { it: "Forti & Trincee 1915-1918 (Asiago, Lavarone, Luserna)", en: "Forts & Trenches 1915-1918 (Asiago, Lavarone, Luserna)" },
  "hero.feat4": { it: "Tour guidati su misura anche in bici e moto/scooter", en: "Custom guided tours also available by bike or motorcycle/scooter" },
  "hero.btnBook": { it: "Richiedi un Preventivo", en: "Request a Quote" },
  "hero.btnExplore": { it: "Esplora gli Itinerari", en: "Explore Itineraries" },
  "slow.tag": { it: "Il Nostro Approccio", en: "Our Approach" },
  "slow.title": { it: "Slow Tourism: Il Tempo di Guardare", en: "Slow Tourism: Time to Observe" },
  "slow.text": { it: "Niente tour mordi-e-fuggi o tappe forzate. Accompagno gruppi piccoli per offrire il tempo necessario a comprendere, apprezzare e vivere davvero l'arte e la storia del territorio con ritmi rilassati e guidati.", en: "No rushed tours or forced stops. I guide small groups to give you the time needed to truly understand, appreciate, and experience the art and history of the region at an unhurried pace." },
  "about.subtitle": { it: "Profilo Professionale", en: "Professional Profile" },
  "about.title": { it: "Prof. Davide Apolloni", en: "Prof. Davide Apolloni" },
  "about.expText": { it: "Anni di esperienza nella divulgazione storico-artistica", en: "Years of experience in cultural & art history guided tours" },
  "about.btnCv": { it: "Leggi il Curriculum Vitae Completo", en: "Read Full Curriculum Vitae" },
  "tours.subtitle": { it: "Esperienze & Itinerari", en: "Experiences & Itineraries" },
  "tours.title": { it: "I Nostri Percorsi Guidati", en: "Our Guided Tours" },
  "tours.desc": { it: "Itinerari studiati per singoli, famiglie, piccoli gruppi o comitive in pullman, con il piacere del turismo lento e percorsi personalizzabili.", en: "Tailor-made itineraries for individuals, families, small groups, or bus tours, with the pleasure of slow tourism." },
  "tours.btnMore": { it: "Scopri di più", en: "Discover more" },
  "tours.btnBook": { it: "Prenota Tour", en: "Book Tour" },
  "events.subtitle": { it: "Prossime Partenze", en: "Upcoming Dates" },
  "events.title": { it: "Eventi & Visite in Evidenza", en: "Featured Events & Tours" },
  "events.desc": { it: "Date speciali e visite a calendario per piccoli gruppi. Posti limitati per garantire un'esperienza culturale di qualità.", en: "Special calendar visits for small groups. Limited availability to guarantee high cultural quality." },
  "events.btnBook": { it: "Prenota questa data", en: "Book this date" },
  "events.badgeNext": { it: "Prossima Partenza", en: "Next Departure" },
  "events.badgeLast": { it: "Ultimi Posti", en: "Last Spots" },
  "events.badgeOpen": { it: "Iscrizioni Aperte", en: "Open Registrations" },
  "events.empty": { it: "Nessuna data in programma al momento. Torna a visitarci o scrivici per una proposta personalizzata.", en: "No dates scheduled at the moment. Check back soon or contact us for a custom proposal." },
  "info.subtitle": { it: "Domande Frequenti", en: "Frequently Asked Questions" },
  "info.title": { it: "Info, Come Funziona & FAQ", en: "Info, How It Works & FAQ" },
  "info.desc": { it: "Risposte rapide alle domande più comuni sulle prenotazioni, sui tempi di risposta e sullo svolgimento delle visite guidate.", en: "Quick answers to the most common questions about bookings, response times, and how guided tours work." },
  "info.empty": { it: "Nessuna FAQ disponibile al momento.", en: "No FAQ available at the moment." },
  "info.ctaQ": { it: "Non hai trovato la risposta che cercavi?", en: "Didn't find the answer you were looking for?" },
  "info.ctaD": { it: "Contattaci direttamente per una domanda specifica o per prenotare la tua prossima visita guidata.", en: "Get in touch directly for any specific question or to book your next guided tour." },
  "info.ctaAlt": { it: "Vai ai Contatti", en: "Go to Contacts" },
  "reviews.empty": { it: "Nessuna recensione disponibile al momento. Sii il primo a lasciare la tua!", en: "No reviews available yet. Be the first to leave yours!" },
  "exclusive.subtitle": { it: "Visite Speciali", en: "Special Visits" },
  "exclusive.title": { it: "Esperienze Esclusive", en: "Exclusive Experiences" },
  "exclusive.desc": { it: "Itinerari evocativi fuori dagli orari di afflusso di massa, disegnati per chi desidera assaporare l'arte e il paesaggio con la giusta calma ed eleganza.", en: "Evocative off-peak itineraries designed for guests who wish to savor art and landscape with elegance and tranquility." },
  "exclusive.btn": { it: "Richiedi questa esperienza", en: "Request this experience" },
  "reviews.subtitle": { it: "Dicono di Noi", en: "Testimonials" },
  "reviews.title": { it: "Testimonianze dei Visitatori", en: "What Visitors Say" },
  "reviews.formTitle": { it: "Lascia una Recensione", en: "Leave a Review" },
  "reviews.namePh": { it: "Il tuo nome", en: "Your name" },
  "reviews.locationPh": { it: "La tua città/nazione (opzionale)", en: "Your city/country (optional)" },
  "reviews.textPh": { it: "Condividi la tua esperienza...", en: "Share your experience..." },
  "reviews.ratingLabel": { it: "Valutazione", en: "Rating" },
  "reviews.submit": { it: "Invia Recensione", en: "Submit Review" },
  "reviews.success": { it: "Grazie! La tua recensione è stata inviata e sarà visibile dopo l'approvazione.", en: "Thank you! Your review has been submitted and will be visible after approval." },
  "media.subtitle": { it: "Galleria & Esperienze", en: "Gallery & Experiences" },
  "media.title": { it: "Scorci e Momenti sul Campo", en: "Glimpses from the Field" },
  "media.desc": { it: "Tutte le immagini del sito e i video testimoniano i luoghi straordinari che potrai scoprire lungo i nostri itinerari guidati.", en: "Photos and videos showcasing the extraordinary sites you will discover during our guided tours." },
  "form.subtitle": { it: "Pianifica la tua Visita", en: "Plan Your Visit" },
  "form.title": { it: "Richiedi un Preventivo Personalizzato", en: "Request a Custom Quote" },
  "form.desc": { it: "Compila il modulo sottostante indicando le tue preferenze. Riceverai un'offerta su misura entro 24-48 ore.", en: "Fill out the form below with your preferences. You will receive a custom proposal within 24-48 hours." },
  "form.name": { it: "Nome e Cognome", en: "Full Name" },
  "form.phName": { it: "Mario Rossi", en: "John Smith" },
  "form.email": { it: "Indirizzo Email", en: "Email Address" },
  "form.phEmail": { it: "mario.rossi@email.com", en: "john.smith@email.com" },
  "form.phone": { it: "Telefono / WhatsApp", en: "Phone / WhatsApp" },
  "form.phPhone": { it: "+39 347 0000000", en: "+1 234 567 8900" },
  "form.category": { it: "Tipo di Tour", en: "Tour Category" },
  "form.destination": { it: "Destinazione Preferita", en: "Preferred Destination" },
  "form.visitLang": { it: "Lingua della Visita", en: "Tour Language" },
  "form.langIt": { it: "Italiano", en: "Italian" },
  "form.langEn": { it: "Inglese", en: "English" },
  "form.datePref": { it: "Data Preferita", en: "Preferred Date" },
  "form.dateAlt": { it: "Data Alternativa (Opzionale)", en: "Alternative Date (Optional)" },
  "form.participants": { it: "Numero Partecipanti", en: "Number of Participants" },
  "form.phPart": { it: "Es. 4", en: "e.g. 4" },
  "form.transport": { it: "Modalità di Spostamento", en: "Travel Mode" },
  "form.trFeet": { it: "A piedi", en: "On foot" },
  "form.trBike": { it: "In Bicicletta / E-Bike", en: "Bicycle / E-Bike" },
  "form.trMoto": { it: "In Moto / Scooter", en: "Motorcycle / Scooter" },
  "form.trCar": { it: "In Automobile propria", en: "By Private Car" },
  "form.trBus": { it: "Pullman / Gruppo Organizzato", en: "Bus / Organized Group" },
  "form.notes": { it: "Note / Richieste Particolari", en: "Notes / Special Requests" },
  "form.phNotes": { it: "Indica eventuali esigenze specifiche...", en: "Specify any particular interest..." },
  "form.gdpr": { it: "Autorizzo il trattamento dei dati personali ai sensi della normativa privacy esclusivamente per rispondere alla richiesta.", en: "I authorize the processing of personal data in accordance with privacy laws exclusively to respond to this request." },
  "form.submit": { it: "Invia Richiesta di Preventivo", en: "Send Quote Request" },
  "form.submitting": { it: "Invio in corso...", en: "Sending..." },
  "form.success": { it: "Grazie! La tua richiesta è stata inviata con successo. Davide ti risponderà entro 24-48 ore.", en: "Thank you! Your request has been sent successfully. Davide will get back to you within 24-48 hours." },
  "form.error": { it: "Si è verificato un errore durante l'invio del modulo. Riprova o scrivi a guidaturistica@davideapolloni.it.", en: "An error occurred while sending. Please try again or email guidaturistica@davideapolloni.it." },
  "contacts.subtitle": { it: "Contatti diretti", en: "Direct contacts" },
  "contacts.title": { it: "Mettiamoci in contatto", en: "Get in touch" },
  "contacts.desc": { it: "Per informazioni rapide, prenotazioni urgenti o collaborazioni istituzionali:", en: "For quick inquiries, urgent bookings, or institutional collaborations:" },
  "contacts.hours": { it: "Orari di disponibilità", en: "Availability hours" },
  "contacts.hoursD": { it: "Dal lunedì alla domenica · 9:00 – 20:00 (risposta personale entro 24–48h)", en: "Monday to Sunday · 9:00 AM – 8:00 PM (personal reply within 24–48h)" },
  "contacts.area": { it: "Zona operativa principale", en: "Main operating area" },
  "contacts.areaDefault": { it: "Regione Veneto e Provincia Autonoma di Trento", en: "Veneto Region & Autonomous Province of Trentino" },
  "contacts.info": { it: "Nota importante", en: "Important note" },
  "contacts.cta": { it: "Compila il modulo di richiesta", en: "Fill in the request form" },
  "contacts.boxTitle": { it: "Riceverò una risposta dal Prof. Apolloni personalmente?", en: "Will I receive a reply from Prof. Apolloni personally?" },
  "contacts.boxDesc": { it: "Sì, assolutamente — non esistono segretarie, operatori o chatbot intermedi. Sarai ricontattato direttamente da me via email o telefono, per definire insieme ogni dettaglio del tuo itinerario, dei luoghi da visitare, delle date e di ogni necessità specifica (pranzi, trasporti, alberghi, accessi).", en: "Yes, absolutely — there are no secretaries, operators, or chatbots in between. You will be contacted directly by me via email or phone to plan every detail of your itinerary." },
  "contacts.boxNote": { it: "Per gruppi numerosi (scuole, associazioni, tour operator) scrivimi con un piccolo anticipo, così posso pianificare al meglio ogni tappa.", en: "For larger groups (schools, associations, tour operators) please write in advance so I can plan every stop carefully." },
  "media.videoTag": { it: "Tour Motociclistico Guidato", en: "Guided Motorcycle Tour" },
  "media.videoTitle": { it: "Riviera del Brenta in Moto & Scooter", en: "Brenta Riviera by Motorbike & Scooter" },
  "media.videoDesc": { it: "Video realizzato dal Treviso Scooter Club durante l'uscita alla scoperta delle Ville Venete del Settecento lungo la Riviera del Brenta, guidati dal Prof. Davide Apolloni con oltre 50 motociclisti!", en: "Video created by the Treviso Scooter Club exploring 18th-century Venetian Villas along the Brenta Riviera, guided by Prof. Davide Apolloni leading over 50 riders!" },
  "media.videoBtn": { it: "Richiedi 'Forti & Ville in Moto'", en: "Request 'Forts & Villas on Wheels'" },
  "media.videoSrc": { it: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", en: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  "media.videoPoster": { it: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80", en: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80" },
  "hero.bg_image": { it: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80", en: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80" },
  "disc.title": { it: "Nota di Trasparenza sui Recapiti Storici", en: "Note on Historical Contact Details" },
  "disc.text": { it: "Il canale ufficiale unico di riferimento corrente è guidaturistica@davideapolloni.it.", en: "The current official single contact address is guidaturistica@davideapolloni.it." },
  "cv.title": { it: "Curriculum Vitae", en: "Curriculum Vitae" },
  "cv.sub": { it: "Curriculum Vitae Accademico & Professionale", en: "Academic & Professional Curriculum Vitae" },
  "cv.close": { it: "Chiudi", en: "Close" },
  "footer.brand_name": { it: "Prof. Davide Apolloni", en: "Prof. Davide Apolloni" },
  "footer.badge": { it: "Guida Turistica Autorizzata · Veneto & Trentino", en: "Licensed Tourist Guide · Veneto & Trentino" },
  "footer.badge.icon": { it: "Award", en: "Award" },
  "footer.desc": { it: "Itinerari culturali d'eccellenza tra Veneto e Trentino, condotti da un professore di storia dell'arte con 20+ anni di esperienza.", en: "Premium cultural itineraries across Veneto & Trentino, led by an Art History professor with 20+ years of experience." },
  "footer.location": { it: "Veneto & Trentino, Italia", en: "Veneto & Trentino, Italy" },
  "footer.location.icon": { it: "MapPin", en: "MapPin" },
  "footer.email": { it: "guidaturistica@davideapolloni.it", en: "guidaturistica@davideapolloni.it" },
  "footer.email.icon": { it: "Mail", en: "Mail" },
  "footer.piva": { it: "—", en: "—" },
  "footer.license": { it: "Regione Veneto & Prov. Autonoma TN", en: "Veneto Region & Autonomous Prov. TN" },
  "footer.nav.icon": { it: "Sparkles", en: "Sparkles" },
  "footer.legal.icon": { it: "Shield", en: "Shield" },
  "footer.role": { it: "Guida Turistica Autorizzata & Accompagnatore Turistico", en: "Authorized Tour Guide & Licensed Tour Leader" },
  "footer.copyright": { it: "Tutti i diritti riservati.", en: "All rights reserved." },
  "footer.top": { it: "Torna in alto ↑", en: "Back to Top ↑" },
  "common.loading": { it: "Caricamento...", en: "Loading..." },
  "common.error": { it: "Si è verificato un errore", en: "An error occurred" },
  "common.required": { it: "Campo obbligatorio", en: "Required field" },
  "common.invalidEmail": { it: "Inserisci un email valida", en: "Enter a valid email" },
  // Hero Banners (default)
  "banner.list": { it: "1,2", en: "1,2" },
  "banner.1.text": { it: "Slow tourism · tempo per guardare", en: "Slow tourism · time to observe" },
  "banner.1.icon": { it: "Hourglass", en: "Hourglass" },
  "banner.1.style": { it: "olive", en: "olive" },
  "banner.2.text": { it: "Professore di Lettere & Storia • Specialista in Storia dell'Arte", en: "Professor of Literature & History • Art History Specialist" },
  "banner.2.icon": { it: "GraduationCap", en: "GraduationCap" },
  "banner.2.style": { it: "neutral", en: "neutral" },
  // Stato manutenzione sito
  "site.maintenance_mode": { it: "false", en: "false" },
};

// ============================================================
// Provider
// ============================================================
export function LanguageProvider({
  children,
  initialStrings,
  initialLang = DEFAULT_LANG,
}: {
  children: React.ReactNode;
  initialStrings: { key: string; it: string; en: string }[];
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [loading, setLoading] = useState(true);

  const [strings, setStrings] = useState<UiStringsMap>(() => {
    const base: UiStringsMap = { ...FALLBACK_STRINGS };
    for (const s of initialStrings) {
      if (s?.key) base[s.key] = { it: s.it, en: s.en };
    }
    return base;
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "it" ? "en" : "it");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const s = strings[key];
      if (s) return s[lang];
      return fallback ?? key;
    },
    [strings, lang]
  );

  // Client-side: sincronizza la lingua dopo l'hydration senza causare hydration mismatch
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang") as Lang | null;
      if (urlLang === "it" || urlLang === "en") {
        setLangState(urlLang);
        setLoading(false);
        return;
      }
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved && (saved === "it" || saved === "en")) setLangState(saved);
    } catch {}
    setLoading(false);
  }, []);

  // Ascolta LIVE_EDIT_UPDATED: aggiorna le stringhe in memoria in tempo reale dopo un salvataggio dall'Editor Live.
  // Questo consente a t() e a tutti i componenti che la usano di ricevere i nuovi valori
  // senza dover ricaricare la pagina.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as any;
      if (data?.type === "LIVE_EDIT_UPDATED" && data.targetId && data.values) {
        const { targetId, values } = data as { targetId: string; values: { it?: string; en?: string } };
        // Aggiorna solo se si tratta di una chiave ui_strings (formato "section.key")
        // Le chiavi non-ui_string (profili, FAQ, ecc.) non hanno stringKey nel LanguageProvider
        setStrings((prev) => {
          if (!(targetId in prev) && !FALLBACK_STRINGS[targetId]) return prev;
          return {
            ...prev,
            [targetId]: {
              it: values.it ?? prev[targetId]?.it ?? "",
              en: values.en ?? prev[targetId]?.en ?? "",
            },
          };
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    lang, setLang, toggleLang, t, strings, loading,
  }), [lang, setLang, toggleLang, t, strings, loading]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() deve essere usato dentro <LanguageProvider>");
  }
  return ctx;
}

/** Semplice alias di useLanguage().t() */
export function useT() {
  return useLanguage().t;
}

/** Hook per ottenere lang + setLang senza t() */
export function useLang() {
  const { lang, setLang, toggleLang } = useLanguage();
  return { lang, setLang, toggleLang };
}
