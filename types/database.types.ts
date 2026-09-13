// ============================================================
// TYPES SUPABASE (generabile anche via CLI)
//   supabase gen types typescript --project-id <project-id> \
//     --schema public > types/database.types.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ============== ADMIN ==============
      admin_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ============== PROFILO ==============
      profiles: {
        Row: {
          id: string;
          first_name_it: string;
          first_name_en: string;
          last_name_it: string;
          last_name_en: string;
          title_it: string;
          title_en: string;
          academic_badge_it: string | null;
          academic_badge_en: string | null;
          photo_url: string | null;
          bio_short_it: string;
          bio_short_en: string;
          bio_long_it: string | null;
          bio_long_en: string | null;
          operating_area_it: string | null;
          operating_area_en: string | null;
          slow_tourism_claim_it: string | null;
          slow_tourism_claim_en: string | null;
          experience_years: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name_it: string;
          first_name_en: string;
          last_name_it: string;
          last_name_en: string;
          title_it: string;
          title_en: string;
          academic_badge_it?: string | null;
          academic_badge_en?: string | null;
          photo_url?: string | null;
          bio_short_it: string;
          bio_short_en: string;
          bio_long_it?: string | null;
          bio_long_en?: string | null;
          operating_area_it?: string | null;
          operating_area_en?: string | null;
          slow_tourism_claim_it?: string | null;
          slow_tourism_claim_en?: string | null;
          experience_years?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name_it?: string;
          first_name_en?: string;
          last_name_it?: string;
          last_name_en?: string;
          title_it?: string;
          title_en?: string;
          academic_badge_it?: string | null;
          academic_badge_en?: string | null;
          photo_url?: string | null;
          bio_short_it?: string;
          bio_short_en?: string;
          bio_long_it?: string | null;
          bio_long_en?: string | null;
          operating_area_it?: string | null;
          operating_area_en?: string | null;
          slow_tourism_claim_it?: string | null;
          slow_tourism_claim_en?: string | null;
          experience_years?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ============== CONTATTI ==============
      contacts: {
        Row: {
          id: string;
          profile_id: string;
          label_it: string;
          label_en: string;
          value: string;
          type: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          label_it: string;
          label_en: string;
          value: string;
          type: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          label_it?: string;
          label_en?: string;
          value?: string;
          type?: string;
          sort_order?: number;
          created_at?: string;
        };
      };

      // ============== CREDENZIALI ==============
      credentials: {
        Row: {
          id: string;
          profile_id: string;
          title_it: string;
          title_en: string;
          description_it: string;
          description_en: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title_it: string;
          title_en: string;
          description_it: string;
          description_en: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credentials"]["Insert"]>;
      };

      // ============== CV ITEMS ==============
      cv_items: {
        Row: {
          id: string;
          profile_id: string;
          section_it: string;
          section_en: string;
          title_it: string;
          title_en: string;
          institution_it: string | null;
          institution_en: string | null;
          period_it: string | null;
          period_en: string | null;
          description_it: string | null;
          description_en: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          section_it: string;
          section_en: string;
          title_it: string;
          title_en: string;
          institution_it?: string | null;
          institution_en?: string | null;
          period_it?: string | null;
          period_en?: string | null;
          description_it?: string | null;
          description_en?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cv_items"]["Insert"]>;
      };

      // ============== TIPI DI VISITA ==============
      tour_types: {
        Row: {
          id: string;
          slug: string;
          name_it: string;
          name_en: string;
          description_it: string | null;
          description_en: string | null;
          icon: string | null;
          color: string;
          sort_order: number;
          is_active: boolean;
          is_custom_tour: boolean;
          is_exclusive: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_it: string;
          name_en: string;
          description_it?: string | null;
          description_en?: string | null;
          icon?: string | null;
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          is_custom_tour?: boolean;
          is_exclusive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tour_types"]["Insert"]>;
      };

      // ============== MEZZI DI TRASPORTO ==============
      transport_modes: {
        Row: {
          id: string;
          slug: string;
          name_it: string;
          name_en: string;
          description_it: string | null;
          description_en: string | null;
          icon_name: string | null;
          color: string;
          sort_order: number;
          is_active: boolean;
          is_available_for_booking: boolean;
          is_available_for_places: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_it: string;
          name_en: string;
          description_it?: string | null;
          description_en?: string | null;
          icon_name?: string | null;
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          is_available_for_booking?: boolean;
          is_available_for_places?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transport_modes"]["Insert"]>;
      };

      // ============== TIPI DI LUOGO ==============
      place_types: {
        Row: {
          id: string;
          slug: string;
          name_it: string;
          name_en: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_it: string;
          name_en: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["place_types"]["Insert"]>;
      };

      // ============== LUOGHI ==============
      places: {
        Row: {
          id: string;
          slug: string;
          place_type_id: string;
          name_it: string;
          name_en: string;
          short_description_it: string;
          short_description_en: string;
          long_description_it: string | null;
          long_description_en: string | null;
          cover_image_url: string | null;
          gallery_urls: string[] | null;
          duration_hours: number | null;
          difficulty: "accessible" | "easy" | "moderate" | "challenging" | null;
          area_it: string | null;
          area_en: string | null;
          tags_it: string[] | null;
          tags_en: string[] | null;
          itinerary_it: string | null;
          itinerary_en: string | null;
          transport_options: string[] | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          place_type_id: string;
          name_it: string;
          name_en: string;
          short_description_it: string;
          short_description_en: string;
          long_description_it?: string | null;
          long_description_en?: string | null;
          cover_image_url?: string | null;
          gallery_urls?: string[] | null;
          duration_hours?: number | null;
          difficulty?: "accessible" | "easy" | "moderate" | "challenging" | null;
          area_it?: string | null;
          area_en?: string | null;
          tags_it?: string[] | null;
          tags_en?: string[] | null;
          itinerary_it?: string | null;
          itinerary_en?: string | null;
          transport_options?: string[] | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
      };

      // ============== PLACE <-> TOUR TYPES (M:N) ==============
      place_tour_types: {
        Row: { place_id: string; tour_type_id: string; created_at: string };
        Insert: { place_id: string; tour_type_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["place_tour_types"]["Insert"]>;
      };

      // ============== EVENTI ==============
      events: {
        Row: {
          id: string;
          tour_type_id: string;
          title_it: string;
          title_en: string;
          description_it: string | null;
          description_en: string | null;
          start_date: string;
          end_date: string | null;
          cover_image_url: string | null;
          total_seats: number | null;
          booked_seats: number | null;
          status: "open" | "last_places" | "full" | "closed";
          notes_it: string | null;
          notes_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_type_id: string;
          title_it: string;
          title_en: string;
          description_it?: string | null;
          description_en?: string | null;
          start_date: string;
          end_date?: string | null;
          cover_image_url?: string | null;
          total_seats?: number | null;
          booked_seats?: number | null;
          status?: "open" | "last_places" | "full" | "closed";
          notes_it?: string | null;
          notes_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };

      // ============== EVENT <-> PLACES (M:N) ==============
      event_places: {
        Row: { event_id: string; place_id: string; sort_order: number; created_at: string };
        Insert: { event_id: string; place_id: string; sort_order?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["event_places"]["Insert"]>;
      };

      // ============== INFO / FAQ ==============
      info_items: {
        Row: {
          id: string;
          category_it: string | null;
          category_en: string | null;
          title_it: string;
          title_en: string;
          content_it: string;
          content_en: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_it?: string | null;
          category_en?: string | null;
          title_it: string;
          title_en: string;
          content_it: string;
          content_en: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["info_items"]["Insert"]>;
      };

      // ============== RECENSIONI ==============
      reviews: {
        Row: {
          id: string;
          author_name: string;
          author_location_it: string | null;
          author_location_en: string | null;
          review_text: string;
          rating: number;
          status: "pending" | "approved" | "rejected";
          tour_type_id: string | null;
          submitted_at: string;
          moderated_at: string | null;
          moderated_by: string | null;
        };
        Insert: {
          id?: string;
          author_name: string;
          author_location_it?: string | null;
          author_location_en?: string | null;
          review_text: string;
          rating: number;
          status?: "pending" | "approved" | "rejected";
          tour_type_id?: string | null;
          submitted_at?: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };

      // ============== PRENOTAZIONI ==============
      bookings: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          tour_type_id: string | null;
          preferred_destination: string | null;
          preferred_date: string | null;
          alternative_date: string | null;
          participants: number | null;
          visit_language: "it" | "en" | null;
          transport: string | null;
          notes: string | null;
          gdpr_consent: boolean;
          status: "new" | "contacted" | "confirmed" | "archived";
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          tour_type_id?: string | null;
          preferred_destination?: string | null;
          preferred_date?: string | null;
          alternative_date?: string | null;
          participants?: number | null;
          visit_language?: "it" | "en" | null;
          transport?: string | null;
          notes?: string | null;
          gdpr_consent?: boolean;
          status?: "new" | "contacted" | "confirmed" | "archived";
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };

      // ============== UI STRINGS ==============
      ui_strings: {
        Row: { key: string; it: string; en: string; description: string | null; updated_at: string };
        Insert: { key: string; it: string; en: string; description?: string | null; updated_at?: string };
        Update: { key?: string; it?: string; en?: string; description?: string | null; updated_at?: string };
      };

      // ============== QUOTE ==============
      quotes: {
        Row: {
          id: string;
          text_it: string;
          text_en: string;
          author_it: string;
          author_en: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          text_it: string;
          text_en: string;
          author_it: string;
          author_en: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      };

      // ============== MEDIA ==============
      media_items: {
        Row: {
          id: string;
          type: "image" | "video";
          url: string;
          thumbnail_url: string | null;
          caption_it: string | null;
          caption_en: string | null;
          tour_type_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "image" | "video";
          url: string;
          thumbnail_url?: string | null;
          caption_it?: string | null;
          caption_en?: string | null;
          tour_type_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_items"]["Insert"]>;
      };
    };

    Views: {};
    Functions: {
      is_admin: { Args: {}; Returns: boolean };
      handle_updated_at: { Args: {}; Returns: "trigger" };
      get_public_profile: {
        Args: {};
        Returns: {
          profile_id: string;
          first_name: string;
          last_name: string;
          title: string;
          academic_badge: string | null;
          photo_url: string | null;
          bio_short: string | null;
          bio_long: string | null;
          operating_area: string | null;
          slow_tourism_claim: string | null;
          experience_years: number | null;
        }[];
      };
    };

    Enums: {
      review_status: "pending" | "approved" | "rejected";
      booking_status: "new" | "contacted" | "confirmed" | "archived";
      event_status: "open" | "last_places" | "full" | "closed";
      difficulty_level: "accessible" | "easy" | "moderate" | "challenging";
      lang: "it" | "en";
      transport_mode_DEPRECATED: "walk" | "bike" | "moto" | "bus";
    };

    CompositeTypes: {};
  };
}

// ============================================================
// HELPERS: Localized entity helpers (frontend)
// ============================================================

export type Lang = "it" | "en";

export function pickLang<T extends { it: string; en: string } | null | undefined>(
  row: T,
  lang: Lang,
  itKey: keyof NonNullable<T> = "it" as any,
  enKey: keyof NonNullable<T> = "en" as any
): string {
  if (!row) return "";
  return String((row as any)[lang === "it" ? itKey : enKey] ?? (row as any)[itKey] ?? "");
}

export interface LocalizedProfile {
  firstName: string;
  lastName: string;
  title: string;
  academicBadge: string;
  bioShort: string;
  bioLong: string;
  operatingArea: string;
  slowTourismClaim: string;
}

export interface LocalizedTourType {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string | null;
  isCustom: boolean;
  isExclusive: boolean;
}

export interface LocalizedPlace {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  area: string;
  tags: string[];
  itinerary: string;
}

export interface LocalizedEvent {
  id: string;
  title: string;
  description: string;
  notes: string;
}

export interface LocalizedInfo {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface DashboardStats {
  newBookings: number;
  pendingReviews: number;
  upcomingEvents: number;
  totalApprovedReviews: number;
  totalPlaces: number;
  totalEvents: number;
  bookingsByMonth: any[];
  latestBookings: any[];
  latestReviews: any[];
}
