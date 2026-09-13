-- =============================================================================
-- DAVIDE APOLLONI — GUIDA TURISTICA AUTORIZZATA
-- Supabase Schema Completo: tabelle, RLS, dati seed, storage
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ESTENSIONI
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 2. TIPI ENUM CUSTOM
-- -----------------------------------------------------------------------------
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE booking_status AS ENUM ('new', 'contacted', 'confirmed', 'archived');
CREATE TYPE event_status AS ENUM ('open', 'last_places', 'full', 'closed');
CREATE TYPE difficulty_level AS ENUM ('accessible', 'easy', 'moderate', 'challenging');
CREATE TYPE lang AS ENUM ('it', 'en');
CREATE TYPE transport_mode AS ENUM ('walk', 'bike', 'moto', 'bus');

-- -----------------------------------------------------------------------------
-- 3. TABELLA: ADMIN_ROLES (gestione ruolo admin via claim)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- -----------------------------------------------------------------------------
-- 4. TABELLA: PROFILE (Profilo professionale di Davide)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name_it TEXT NOT NULL,
  first_name_en TEXT NOT NULL,
  last_name_it TEXT NOT NULL,
  last_name_en TEXT NOT NULL,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  academic_badge_it TEXT,
  academic_badge_en TEXT,
  photo_url TEXT,
  bio_short_it TEXT NOT NULL,
  bio_short_en TEXT NOT NULL,
  bio_long_it TEXT,
  bio_long_en TEXT,
  operating_area_it TEXT,
  operating_area_en TEXT,
  slow_tourism_claim_it TEXT,
  slow_tourism_claim_en TEXT,
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. TABELLA: CONTACTS (Contatti multipli etichettati)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label_it TEXT NOT NULL,
  label_en TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'whatsapp', 'other')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. TABELLA: CREDENTIALS (Lista credenziali del profilo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_it TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. TABELLA: CV_ITEMS (Voci Curriculum Vitae)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_it TEXT NOT NULL,
  section_en TEXT NOT NULL,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  institution_it TEXT,
  institution_en TEXT,
  period_it TEXT,
  period_en TEXT,
  description_it TEXT,
  description_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. TABELLA: TOUR_TYPES (Tipi di visita / Categorie tour)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  icon TEXT,
  color TEXT DEFAULT '#C86D51',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom_tour BOOLEAN NOT NULL DEFAULT FALSE,
  is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. TABELLA: PLACE_TYPES (Tassonomia tipi di luogo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. TABELLA: PLACES (Luoghi / Place card)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  place_type_id UUID NOT NULL REFERENCES public.place_types(id) ON DELETE RESTRICT,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  short_description_it TEXT NOT NULL,
  short_description_en TEXT NOT NULL,
  long_description_it TEXT,
  long_description_en TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  duration_hours NUMERIC,
  difficulty difficulty_level DEFAULT 'easy',
  area_it TEXT,
  area_en TEXT,
  tags_it TEXT[] DEFAULT '{}',
  tags_en TEXT[] DEFAULT '{}',
  itinerary_it TEXT,
  itinerary_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. TABELLA: PLACE_TOUR_TYPES (Relazione M:N luoghi <-> tipi di visita)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_tour_types (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  tour_type_id UUID NOT NULL REFERENCES public.tour_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (place_id, tour_type_id)
);

-- -----------------------------------------------------------------------------
-- 12. TABELLA: EVENTS (Eventi / Calendario visite)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_type_id UUID NOT NULL REFERENCES public.tour_types(id) ON DELETE RESTRICT,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  cover_image_url TEXT,
  total_seats INTEGER,
  booked_seats INTEGER DEFAULT 0,
  status event_status NOT NULL DEFAULT 'open',
  notes_it TEXT,
  notes_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. TABELLA: EVENT_PLACES (Relazione M:N eventi <-> luoghi)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_places (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, place_id)
);

-- -----------------------------------------------------------------------------
-- 14. TABELLA: INFO_ITEMS (Sezione FAQ / Info)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.info_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_it TEXT,
  category_en TEXT,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_it TEXT NOT NULL,
  content_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. TABELLA: REVIEWS (Recensioni con moderazione)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_location_it TEXT,
  author_location_en TEXT,
  review_text TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status review_status NOT NULL DEFAULT 'pending',
  tour_type_id UUID REFERENCES public.tour_types(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 16. TABELLA: BOOKINGS (Prenotazioni / Richieste dal form)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  tour_type_id UUID REFERENCES public.tour_types(id) ON DELETE SET NULL,
  preferred_destination TEXT,
  preferred_date DATE,
  alternative_date DATE,
  participants INTEGER,
  visit_language lang,
  transport transport_mode,
  notes TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  status booking_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 17. TABELLA: UI_STRINGS (Stringhe di interfaccia bilingue — TUTTO il microcopy)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ui_strings (
  key TEXT PRIMARY KEY,
  it TEXT NOT NULL,
  en TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 18. TABELLA: QUOTE (Citazione di chiusura)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_it TEXT NOT NULL,
  text_en TEXT NOT NULL,
  author_it TEXT NOT NULL,
  author_en TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 19. TABELLA: MEDIA_ITEMS (Galleria immagini & video)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption_it TEXT,
  caption_en TEXT,
  tour_type_id UUID REFERENCES public.tour_types(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — ABILITAZIONE GLOBALE
-- =============================================================================
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_tour_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_strings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FUNZIONE HELPER: is_admin() — usata nelle policy RLS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
      AND ar.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- =============================================================================
-- POLICY RLS: ADMIN_ROLES (solo admin può leggere/gestire)
-- =============================================================================
CREATE POLICY "Admin roles: admin full access"
  ON public.admin_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: PROFILES (Lettura pubblica, Scrittura solo admin)
-- =============================================================================
CREATE POLICY "Profiles: public read"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Profiles: admin write"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: CONTACTS
-- =============================================================================
CREATE POLICY "Contacts: public read"
  ON public.contacts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Contacts: admin write"
  ON public.contacts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: CREDENTIALS
-- =============================================================================
CREATE POLICY "Credentials: public read"
  ON public.credentials FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Credentials: admin write"
  ON public.credentials FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: CV_ITEMS
-- =============================================================================
CREATE POLICY "CV items: public read"
  ON public.cv_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "CV items: admin write"
  ON public.cv_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: TOUR_TYPES (Pubblico legge attivi, admin tutti + scrittura)
-- =============================================================================
CREATE POLICY "Tour types: public read active"
  ON public.tour_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Tour types: admin full access"
  ON public.tour_types FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: PLACE_TYPES
-- =============================================================================
CREATE POLICY "Place types: public read"
  ON public.place_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Place types: admin write"
  ON public.place_types FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: PLACES (Pubblico legge attivi, admin tutti + scrittura)
-- =============================================================================
CREATE POLICY "Places: public read active"
  ON public.places FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Places: admin full access"
  ON public.places FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: PLACE_TOUR_TYPES
-- =============================================================================
CREATE POLICY "Place-tour_types: public read"
  ON public.place_tour_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Place-tour_types: admin write"
  ON public.place_tour_types FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: EVENTS (Pubblico legge attivi, admin tutti + scrittura)
-- =============================================================================
CREATE POLICY "Events: public read active"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Events: admin full access"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: EVENT_PLACES
-- =============================================================================
CREATE POLICY "Event-places: public read"
  ON public.event_places FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Event-places: admin write"
  ON public.event_places FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: INFO_ITEMS
-- =============================================================================
CREATE POLICY "Info items: public read active"
  ON public.info_items FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Info items: admin full access"
  ON public.info_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: REVIEWS
--   - Pubblico: legge SOLO approved
--   - Ospite: può INSERIRE (stato pending)
--   - Admin: legge tutti, approva/rifiuta/modifica
-- =============================================================================
CREATE POLICY "Reviews: public read approved only"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Reviews: admin read all"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Reviews: anonymous can submit pending"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Reviews: admin moderate"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: BOOKINGS
--   - Pubblico: può INSERIRE (stato new)
--   - Admin: lettura + scrittura completa
--   - Nessuno legge le prenotazioni altrui
-- =============================================================================
CREATE POLICY "Bookings: anonymous/public can insert"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

CREATE POLICY "Bookings: admin full access"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: UI_STRINGS
-- =============================================================================
CREATE POLICY "UI strings: public read"
  ON public.ui_strings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "UI strings: admin write"
  ON public.ui_strings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: QUOTES
-- =============================================================================
CREATE POLICY "Quotes: public read active"
  ON public.quotes FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Quotes: admin full access"
  ON public.quotes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- POLICY RLS: MEDIA_ITEMS
-- =============================================================================
CREATE POLICY "Media items: public read active"
  ON public.media_items FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Media items: admin full access"
  ON public.media_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- TRIGGER: updated_at automatico
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_tour_types_updated_at
  BEFORE UPDATE ON public.tour_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_ui_strings_updated_at
  BEFORE UPDATE ON public.ui_strings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- INDICI PER PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_places_place_type_id ON public.places(place_type_id);
CREATE INDEX IF NOT EXISTS idx_places_is_active ON public.places(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_types_is_active ON public.tour_types(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_types_slug ON public.tour_types(slug);
CREATE INDEX IF NOT EXISTS idx_events_tour_type_id ON public.events(tour_type_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_credentials_profile_id ON public.credentials(profile_id);
CREATE INDEX IF NOT EXISTS idx_cv_items_profile_id ON public.cv_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_id ON public.contacts(profile_id);

-- =============================================================================
-- === SEED DATA: PROFILO DAVIDE ===
-- =============================================================================
INSERT INTO public.profiles (
  first_name_it, first_name_en, last_name_it, last_name_en,
  title_it, title_en,
  academic_badge_it, academic_badge_en,
  photo_url,
  bio_short_it, bio_short_en,
  bio_long_it, bio_long_en,
  operating_area_it, operating_area_en,
  slow_tourism_claim_it, slow_tourism_claim_en,
  experience_years
) VALUES (
  'Davide', 'Davide', 'Apolloni', 'Apolloni',
  'Guida Turistica Autorizzata e Accompagnatore Turistico', 'Authorized Tour Guide and Licensed Tour Leader',
  'Professore di Lettere & Storia • Specialista in Storia dell''Arte',
  'Professor of Literature & History • Art History Specialist',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20male%20italian%20art%20history%20professor%20tour%20guide%20in%20his%2040s%20with%20elegant%20shirt%20kind%20smile%20warm%20natural%20light%20minimal%20stone%20terracotta%20background&image_size=square_hd',
  'Sono Davide Apolloni, professore di Lettere e Storia, specialista in Storia dell''Arte Moderna, Guida Turistica Autorizzata e Accompagnatore Turistico abilitato anche in lingua inglese.',
  'I am Davide Apolloni, Professor of Literature and History, Specialist in Modern Art History, Authorized Tourist Guide, and licensed Tour Leader in English.',
  'Laureato in Lettere con indirizzo storico-artistico presso l''Università degli Studi di Padova e specializzato presso la Scuola di Specializzazione della medesima università, metto al servizio dei visitatori una solida formazione accademica coniugata alla passione per la divulgazione culturale. Niente tour mordi-e-fuggi o tappe forzate: accompagno gruppi piccoli per offrire il tempo necessario a comprendere, apprezzare e vivere davvero l''arte e la storia del territorio.',
  'Graduated in Literature with art history specialization at Padua University and postgraduate from the Specialisation School of the same University, I offer visitors solid academic expertise combined with passion for cultural storytelling. No rushed tours or forced stops: I guide small groups to give you the time needed to truly understand, appreciate, and experience the art and history of the region.',
  'Regione Veneto e Provincia Autonoma di Trento',
  'Veneto Region and Autonomous Province of Trentino',
  'Slow tourism · tempo per guardare',
  'Slow tourism · time to observe',
  20
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: CONTATTI
-- =============================================================================
INSERT INTO public.contacts (profile_id, label_it, label_en, value, type, sort_order)
SELECT id,
  'Email Principale', 'Primary Email',
  'guidaturistica@davideapolloni.it', 'email', 1
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.contacts (profile_id, label_it, label_en, value, type, sort_order)
SELECT id,
  'Telefono / Cellulare', 'Phone / Mobile',
  '+39 347 0000000', 'phone', 2
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.contacts (profile_id, label_it, label_en, value, type, sort_order)
SELECT id,
  'WhatsApp', 'WhatsApp',
  '+39 347 0000000', 'whatsapp', 3
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: CREDENZIALI
-- =============================================================================
INSERT INTO public.credentials (profile_id, title_it, title_en, description_it, description_en, icon, sort_order)
SELECT id,
  'Formazione di Eccellenza', 'Academic Excellence',
  'Laurea e Specializzazione in Storia dell''Arte a Padova, Master in Storia della Letteratura e Età Moderna.',
  'Degree & Postgraduate Specialization in Art History at Padua University, two Masters degrees.',
  'graduation-cap', 1
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.credentials (profile_id, title_it, title_en, description_it, description_en, icon, sort_order)
SELECT id,
  'Autore & Formatore', 'Author & Educator',
  'Collaboratore delle case editrici Rizzoli ed Erickson per manuali scolastici e guide per docenti.',
  'Co-author and contributor for Rizzoli and Erickson publishing houses for art and history books.',
  'book-open', 2
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.credentials (profile_id, title_it, title_en, description_it, description_en, icon, sort_order)
SELECT id,
  'Istituzioni Culturali', 'Cultural Institutions',
  'Esperienze di ricerca presso Castelvecchio (Verona), Fondazione Cini (Venezia) ed École du Louvre (Parigi).',
  'Research experience at Castelvecchio (Verona), Fondazione Cini (Venice), and École du Louvre (Paris).',
  'landmark', 3
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.credentials (profile_id, title_it, title_en, description_it, description_en, icon, sort_order)
SELECT id,
  'Grande Guerra 1915-1918', 'World War I Specialist',
  'Specializzato sui luoghi della Prima Guerra Mondiale nell''Altopiano di Asiago, Lavarone e Luserna.',
  'Specialized course certification on WWI sites in Asiago, Lavarone, and Luserna plateaus.',
  'shield-halved', 4
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: CV ITEMS
-- =============================================================================
INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Formazione & Specializzazioni', 'Education & Specializations',
  'Laurea in Lettere (indirizzo storico-artistico)',
  'Degree in Literature (Art History orientation)',
  'Università degli Studi di Padova',
  'University of Padua',
  NULL, NULL, NULL, NULL, 1
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Formazione & Specializzazioni', 'Education & Specializations',
  'Specializzazione in Storia dell''Arte Moderna',
  'Postgraduate Specialization in Modern Art History',
  'Scuola di Specializzazione dell''Università di Padova',
  'Specialisation School of Padua University',
  NULL, NULL, NULL, NULL, 2
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Formazione & Specializzazioni', 'Education & Specializations',
  'Due Master annuali in Letteratura Italiana e Età Moderna e Contemporanea',
  'Two Master degrees in Italian Literature and Modern & Contemporary History',
  NULL, NULL, NULL, NULL, NULL, NULL, 3
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Formazione & Specializzazioni', 'Education & Specializations',
  'Abilitazioni all''Insegnamento',
  'Teaching Credentials',
  'Università di Bolzano e Udine',
  'Free University of Bozen-Bolzano and Udine University',
  NULL, NULL, NULL, NULL, 4
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Formazione & Specializzazioni', 'Education & Specializations',
  'Corso di Specializzazione "I Luoghi della Grande Guerra"',
  'Specialized Course "Sites of the Great War"',
  'Asiago, patrocinio Regione Veneto',
  'Asiago, sponsored by Veneto Region',
  '2014', '2014', NULL, NULL, 5
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Esperienze e Collaborazioni Culturali', 'Cultural Experience & Collaborations',
  'Gabinetto di Disegni e Stampe',
  'Cabinet of Prints and Drawings',
  'Museo Castelvecchio di Verona',
  'Castelvecchio Museum, Verona',
  NULL, NULL, NULL, NULL, 6
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Esperienze e Collaborazioni Culturali', 'Cultural Experience & Collaborations',
  'Istituto di Storia dell''Arte',
  'Institute of Art History',
  'Fondazione Giorgio Cini di Venezia',
  'Giorgio Cini Foundation, Venice',
  NULL, NULL, NULL, NULL, 7
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Esperienze e Collaborazioni Culturali', 'Cultural Experience & Collaborations',
  'Collaborazioni culturali',
  'Cultural Collaborations',
  'Istituto Veneto di Scienze ed École du Louvre (Parigi)',
  'Istituto Veneto di Scienze and École du Louvre, Paris',
  NULL, NULL, NULL, NULL, 8
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Esperienze e Collaborazioni Culturali', 'Cultural Experience & Collaborations',
  'Guida storica sul battello Il Burchiello',
  'Historical guide on board "Il Burchiello" boat',
  'Riviera del Brenta',
  'Brenta Riviera',
  NULL, NULL, NULL, NULL, 9
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cv_items (profile_id, section_it, section_en, title_it, title_en, institution_it, institution_en, period_it, period_en, description_it, description_en, sort_order)
SELECT id,
  'Esperienze e Collaborazioni Culturali', 'Cultural Experience & Collaborations',
  'Formatore docenti e Autore',
  'Teacher Trainer and Author',
  'Rizzoli Education ed Erickson',
  'Rizzoli Education and Erickson',
  NULL, NULL, NULL, NULL, 10
FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: TOUR TYPES (Tipi di visita)
-- =============================================================================
INSERT INTO public.tour_types (slug, name_it, name_en, description_it, description_en, icon, color, sort_order, is_custom_tour, is_exclusive)
VALUES
  ('citta-arte', 'Città d''Arte', 'Art Cities',
    'Visite guidate nei centri storici più affascinanti: percorsi classici e monumenti segreti.',
    'Guided walking tours in captivating historic centers: classic paths and hidden gems.',
    'landmark', '#3D6E90', 1, FALSE, FALSE),
  ('ville-castelli', 'Ville e Castelli', 'Villas & Castles',
    'Un viaggio tra le capolavori di Andrea Palladio e i maestosi castelli del Trentino.',
    'A journey through Andrea Palladio''s masterpieces and majestic Alpine castles.',
    'castle', '#4A6535', 2, FALSE, FALSE),
  ('grande-guerra', 'Grande Guerra 1915-1918', 'World War I 1915-1918',
    'Itinerari storico-letterari sui forti, le trincee e i campi di battaglia.',
    'Historical-literary itineraries exploring forts, trenches, and battlefields.',
    'shield-halved', '#9C1C1C', 3, FALSE, FALSE),
  ('esperienze-esclusive', 'Esperienze Esclusive', 'Exclusive Experiences',
    'Itinerari evocativi fuori dagli orari di afflusso di massa, notturni e all''alba.',
    'Evocative off-peak itineraries, nighttime and sunrise experiences.',
    'moon', '#6E1212', 4, FALSE, TRUE),
  ('tour-su-misura', 'Tour su Misura', 'Tailor-Made Tour',
    'Itinerario completamente personalizzato sulle tue esigenze, per singoli o piccoli gruppi.',
    'Fully customized itinerary designed around your needs, for individuals or small groups.',
    'compass', '#244D68', 5, TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED DATA: PLACE TYPES (Tassonomia tipi di luogo)
-- =============================================================================
INSERT INTO public.place_types (slug, name_it, name_en, icon, sort_order)
VALUES
  ('citta-storica', 'Città murata / Centro storico', 'Walled City / Historic Center', 'building', 1),
  ('villa', 'Villa Veneta / Dimora Storica', 'Venetian Villa / Historic Estate', 'home', 2),
  ('castello', 'Castello / Fortezza', 'Castle / Fortress', 'castle', 3),
  ('sito-storico', 'Sito Storico / Archeologico', 'Historical / Archaeological Site', 'landmark', 4),
  ('museo', 'Museo / Pinacoteca', 'Museum / Art Gallery', 'landmark', 5),
  ('area-naturale', 'Area Naturale / Paesaggio', 'Natural Area / Landscape', 'mountain', 6)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED DATA: LUOGHI (esempi principali)
-- =============================================================================
INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'venezia-classica', pt.id,
  'Venezia (Classica & Nascosta)', 'Venice (Classic & Hidden)',
  'Visita guidata tra i capolavori di San Marco, Palazzo Ducale e le calli segrete meno conosciute.',
  'Guided tour through St. Mark''s masterpieces, Doge''s Palace and the lesser-known secret alleys.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=grand%20canal%20venice%20at%20golden%20hour%20historic%20palaces%20stone%20buildings%20warm%20terracotta%20olive%20colors%20editorial%20photography&image_size=landscape_16_9',
  'easy'::difficulty_level,
  'Venezia', 'Venice',
  ARRAY['adatto famiglie', 'accessibile parzialmente'],
  ARRAY['family friendly', 'partially accessible'],
  1
FROM public.place_types pt WHERE pt.slug = 'citta-storica' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'padova-scrovegni', pt.id,
  'Padova (Il Santo e Scrovegni)', 'Padua (St. Anthony & Scrovegni)',
  'La Cappella degli Scrovegni con Giotto, la Basilica di Sant''Antonio e il Prato della Valle.',
  'The Scrovegni Chapel with Giotto, the Basilica of St. Anthony and Prato della Valle.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=scrovegni%20chapel%20exterior%20padua%20italy%20warm%20sunlight%20stone%20terracotta%20architecture%20minimal%20editorial&image_size=landscape_16_9',
  'easy'::difficulty_level,
  'Padova', 'Padua',
  ARRAY['adatto famiglie', 'arte medievale'],
  ARRAY['family friendly', 'medieval art'],
  2
FROM public.place_types pt WHERE pt.slug = 'museo' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'villa-rotonda', pt.id,
  'Villa Rotonda (Vicenza)', 'Villa Rotonda (Vicenza)',
  'La capolavoro di Andrea Palladio: villa simmetrica immersa nel verde, con affreschi e giardini.',
  'Andrea Palladio''s masterpiece: symmetrical villa surrounded by greenery, with frescoes and gardens.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=villa%20rotonda%20palladio%20vicenza%20italy%20renaissance%20symmetry%20architectural%20photography%20olive%20stone%20terracotta%20roof&image_size=landscape_16_9',
  'easy'::difficulty_level,
  'Vicenza', 'Vicenza',
  ARRAY['palladio', 'giardini', 'architettura rinascimentale'],
  ARRAY['palladio', 'gardens', 'renaissance architecture'],
  3
FROM public.place_types pt WHERE pt.slug = 'villa' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'villa-maser', pt.id,
  'Villa Maser & Villa Emo', 'Villa Maser & Villa Emo',
  'Due delle più belle ville palladiane, con affreschi del Veronese e atmosfera di campagna veneta.',
  'Two of the most beautiful Palladian villas, with Veronese frescoes and Venetian countryside atmosphere.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=villa%20maser%20treviso%20veneto%20palladian%20villa%20with%20vineyard%20landscape%20warm%20sunset%20light%20editorial%20photography&image_size=landscape_16_9',
  'easy'::difficulty_level,
  'Treviso', 'Treviso',
  ARRAY['palladio', 'affreschi', 'vigneti'],
  ARRAY['palladio', 'frescoes', 'vineyards'],
  4
FROM public.place_types pt WHERE pt.slug = 'villa' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'castel-thun', pt.id,
  'Castel Thun (Val di Non)', 'Thun Castle (Val di Non)',
  'Uno dei castelli più maestosi del Trentino, immerso nelle mele della Val di Non.',
  'One of Trentino''s most majestic castles, surrounded by the apple orchards of Val di Non.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=medieval%20castle%20thun%20trentino%20italy%20alpine%20forest%20stone%20fortress%20dramatic%20olive%20terracotta%20atmosphere&image_size=landscape_16_9',
  'moderate'::difficulty_level,
  'Val di Non, Trentino', 'Non Valley, Trentino',
  ARRAY['castello medievale', 'moto-friendly'],
  ARRAY['medieval castle', 'moto-friendly'],
  5
FROM public.place_types pt WHERE pt.slug = 'castello' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.places (
  slug, place_type_id,
  name_it, name_en,
  short_description_it, short_description_en,
  cover_image_url,
  difficulty, area_it, area_en,
  tags_it, tags_en,
  sort_order
)
SELECT
  'forti-asiago', pt.id,
  'Altopiano di Asiago (Forti & Trincee)', 'Asiago Plateau (Forts & Trenches)',
  'Forti, trincee e Sacrario Militare: itinerario storico-letterario sui luoghi del Fronte Italiano.',
  'Forts, trenches and Military Shrine: historical-literary itinerary on the Italian Front sites.',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=wwi%20fort%20trenches%20asiago%20plateau%20alpine%20landscape%20stone%20fortress%20dramatic%20sky%20historical%20atmosphere&image_size=landscape_16_9',
  'challenging'::difficulty_level,
  'Altopiano di Asiago', 'Asiago Plateau',
  ARRAY['storia', 'cammino', 'moto-friendly'],
  ARRAY['history', 'hiking', 'moto-friendly'],
  6
FROM public.place_types pt WHERE pt.slug = 'sito-storico' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED DATA: PLACE <-> TOUR TYPES (Relazioni)
-- =============================================================================
INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'venezia-classica' AND tt.slug = 'citta-arte'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'venezia-classica' AND tt.slug = 'esperienze-esclusive'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'padova-scrovegni' AND tt.slug = 'citta-arte'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'villa-rotonda' AND tt.slug = 'ville-castelli'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'villa-maser' AND tt.slug = 'ville-castelli'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'villa-maser' AND tt.slug = 'esperienze-esclusive'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'castel-thun' AND tt.slug = 'ville-castelli'
ON CONFLICT DO NOTHING;

INSERT INTO public.place_tour_types (place_id, tour_type_id)
SELECT p.id, tt.id FROM public.places p, public.tour_types tt
WHERE p.slug = 'forti-asiago' AND tt.slug = 'grande-guerra'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: EVENTI (Prossime partenze esempio)
-- =============================================================================
INSERT INTO public.events (
  tour_type_id,
  title_it, title_en,
  description_it, description_en,
  start_date, end_date,
  cover_image_url,
  total_seats, booked_seats, status,
  sort_order
)
SELECT
  tt.id,
  'Venezia in Notturna — 20 Settembre',
  'Nighttime Venice — September 20',
  'Una passeggiata guidata tra le calli e i campielli di Venezia al calare della sera, quando la folla si dirada e la città ritrova il suo fascino intimo e misterioso.',
  'A guided twilight walk through Venice''s quiet alleys and squares, as crowds diminish and the city reveals its intimate, poetic charm.',
  '2026-09-20 18:30:00+02', '2026-09-20 22:00:00+02',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=venice%20canal%20at%20night%20moonlight%20reflection%20on%20water%20mysterious%20atmosphere%20lanterns%20editorial&image_size=landscape_16_9',
  12, 9, 'last_places'::event_status,
  1
FROM public.tour_types tt WHERE tt.slug = 'esperienze-esclusive' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.events (
  tour_type_id,
  title_it, title_en,
  description_it, description_en,
  start_date, end_date,
  cover_image_url,
  total_seats, booked_seats, status,
  sort_order
)
SELECT
  tt.id,
  'Ville Venete all''Imbrunire — 4 Ottobre',
  'Venetian Villas at Dusk — October 4',
  'Visita guidata speciale a Villa Pisani e Riviera del Brenta con la luce dorata del tramonto e introduzione all''architettura palladiana.',
  'Special sunset guided visit to Villa Pisani and Brenta Riviera with an introduction to Palladian architecture.',
  '2026-10-04 17:00:00+02', '2026-10-04 20:30:00+02',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=venetian%20villa%20at%20golden%20hour%20sunset%20light%20garden%20palladian%20architecture%20terracotta%20warm%20tones&image_size=landscape_16_9',
  15, 4, 'open'::event_status,
  2
FROM public.tour_types tt WHERE tt.slug = 'ville-castelli' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.events (
  tour_type_id,
  title_it, title_en,
  description_it, description_en,
  start_date, end_date,
  cover_image_url,
  total_seats, booked_seats, status,
  sort_order
)
SELECT
  tt.id,
  'I Forti del Fronte Alpino — 18 Ottobre',
  'Forts of the Alpine Front — October 18',
  'Itinerario storico-letterario tra Forte Belvedere Gschwent e le trincee dell''Altopiano di Lavarone, con letture dai diari di guerra.',
  'Historical-literary route between Belvedere Fort and Lavarone plateau trenches with readings from war diaries.',
  '2026-10-18 09:30:00+02', '2026-10-18 17:00:00+02',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=alpine%20wwi%20fort%20mountain%20view%20lavarone%20plateau%20autumn%20foliage%20olive%20stone%20colors%20editorial&image_size=landscape_16_9',
  20, 2, 'open'::event_status,
  3
FROM public.tour_types tt WHERE tt.slug = 'grande-guerra' LIMIT 1
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: INFO ITEMS (FAQ)
-- =============================================================================
INSERT INTO public.info_items (category_it, category_en, title_it, title_en, content_it, content_en, sort_order)
VALUES
  ('Come funziona', 'How it works',
    'Come funziona una prenotazione', 'How a booking works',
    'Compila il form di contatto indicando le tue preferenze: tipo di visita, data preferita, numero partecipanti. Entro 24-48 ore riceverai un preventivo dettagliato via email. Dopo la conferma e il pagamento dell''acconto, la prenotazione è definitiva.',
    'Fill out the contact form with your preferences: tour type, preferred date, number of participants. Within 24-48 hours you will receive a detailed quote by email. After confirmation and payment of the deposit, the booking is final.',
    1),
  ('Area operativa', 'Operating region',
    'Zona coperta dalle visite', 'Area covered by tours',
    'Opero principalmente in Regione Veneto (Venezia, Padova, Vicenza, Verona, Treviso, Rovigo) e nella Provincia Autonoma di Trento (Trento, Rovereto, Altipiani, Val di Non, Valli Giudicarie). Per richieste specifiche su altre aree (Bolzano, Merano, Bressanone) è possibile concordare itinerari su misura.',
    'I mainly operate in the Veneto Region (Venice, Padua, Vicenza, Verona, Treviso, Rovigo) and the Autonomous Province of Trentino (Trento, Rovereto, Plateaus, Val di Non, Giudicarie Valleys). For specific requests in other areas (Bolzano, Merano, Brixen) tailor-made itineraries can be arranged.',
    2),
  ('Lingue', 'Languages',
    'Lingue disponibili', 'Available languages',
    'Le visite possono essere svolte in italiano e in inglese. Per altre lingue è possibile organizzarsi con interprete professionista (costo aggiuntivo da concordare).',
    'Tours can be conducted in Italian and English. For other languages it is possible to organize with a professional interpreter (additional cost to be agreed).',
    3),
  ('Condizioni', 'Terms',
    'Condizioni di cancellazione', 'Cancellation policy',
    'Cancellazioni fino a 7 giorni prima: rimborso completo dell''acconto. Tra 7 e 3 giorni: rimborso del 50%. Entro 3 giorni o no-show: nessun rimborso. In caso di maltempo o cause di forza maggiore, la visita può essere riprogrammata senza costi aggiuntivi.',
    'Cancellations up to 7 days before: full deposit refund. Between 7 and 3 days: 50% refund. Within 3 days or no-show: no refund. In case of bad weather or force majeure, the tour can be rescheduled at no extra cost.',
    4)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: REVIEWS APPROVATE (3 di esempio)
-- =============================================================================
INSERT INTO public.reviews (author_name, author_location_it, author_location_en, review_text, rating, status)
VALUES
  ('Marco & Elena B.', 'Milano', 'Milan',
    'Il Prof. Apolloni ha saputo farci rivivere la storia delle Ville Venete con una passione e una chiarezza straordinarie. Un tour colmo di dettagli che non si trovano sulle guide classiche.',
    5, 'approved'),
  ('Giuseppe T.', 'Verona', 'Verona',
    'L''itinerario della Grande Guerra sull''Altopiano di Asiago è stato toccante ed esaustivo. Le letture storiche durante il cammino hanno reso la giornata indimenticabile.',
    5, 'approved'),
  ('Sophie & Thomas', 'Parigi (Francia)', 'Paris (France)',
    'La visita di Venezia in notturna è stata magica. Davide cammina davvero al tuo fianco, lasciando spazio alle domande e al piacere di osservare.',
    5, 'approved')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: QUOTE (Citazione di chiusura)
-- =============================================================================
INSERT INTO public.quotes (text_it, text_en, author_it, author_en, is_active)
VALUES (
  'Una buona guida non recita una lezione: cammina accanto a voi e vi lascia il tempo di guardare.',
  'A good guide doesn''t recite a lesson: they walk beside you and leave you time to observe.',
  'Davide Apolloni',
  'Davide Apolloni',
  TRUE
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA: UI_STRINGS (TUTTE le stringhe di interfaccia da translations.js)
-- =============================================================================
INSERT INTO public.ui_strings (key, it, en, description) VALUES
  ('nav.subtitle', 'Guida Turistica Autorizzata', 'Authorized Tour Guide', 'Sottotitolo logo'),
  ('nav.about', 'Chi sono', 'About Me', 'Menu nav'),
  ('nav.tours', 'I Tour', 'Tours', 'Menu nav'),
  ('nav.experiences', 'Esperienze', 'Experiences', 'Menu nav'),
  ('nav.ww1', 'Grande Guerra', 'World War I', 'Menu nav'),
  ('nav.media', 'Galleria & Video', 'Gallery & Video', 'Menu nav'),
  ('nav.contacts', 'Contatti', 'Contact', 'Menu nav'),
  ('nav.book', 'Prenota una visita', 'Book a visit', 'CTA nav'),

  ('hero.badge', 'Professore di Lettere & Storia • Specialista in Storia dell''Arte', 'Professor of Literature & History • Art History Specialist', 'Badge hero'),
  ('hero.title', 'Scopri Veneto & Trentino con una <span>Guida Turistica Autorizzata</span>', 'Discover Veneto & Trentino with an <span>Authorized Tour Guide</span>', 'Titolo hero'),
  ('hero.desc', 'Itinerari culturali ed eleganti condotti da un professore di storia dell''arte ed esperto del territorio. Dalle iconiche Ville Palladiane ai suggestivi Castelli Trentini, fino ai percorsi storico-letterari sui luoghi della Grande Guerra.', 'Elegant cultural itineraries led by an Art History Professor and local expert. From iconic Palladian Villas to breathtaking Trentino Castles and WWI historical-literary sites.', 'Descrizione hero'),
  ('hero.feat1', 'Città d''Arte: Venezia, Padova, Vicenza, Trento, Bolzano', 'Art Cities: Venice, Padua, Vicenza, Trent, Bolzano', 'Highlight hero 1'),
  ('hero.feat2', 'Ville Palladiane & Dimore Storiche del Brenta', 'Palladian Villas & Riviera del Brenta Estates', 'Highlight hero 2'),
  ('hero.feat3', 'Forti & Trincee 1915-1918 (Asiago, Lavarone, Luserna)', 'Forts & Trenches 1915-1918 (Asiago, Lavarone, Luserna)', 'Highlight hero 3'),
  ('hero.feat4', 'Tour guidati su misura anche in bici e moto/scooter', 'Custom guided tours also available by bike or motorcycle/scooter', 'Highlight hero 4'),
  ('hero.btnBook', 'Richiedi un Preventivo', 'Request a Quote', 'CTA hero 1'),
  ('hero.btnExplore', 'Esplora gli Itinerari', 'Explore Itineraries', 'CTA hero 2'),

  ('slow.tag', 'Il Nostro Approccio', 'Our Approach', 'Tag sezione slow'),
  ('slow.title', 'Slow Tourism: Il Tempo di Guardare', 'Slow Tourism: Time to Observe', 'Titolo banner slow'),
  ('slow.text', 'Niente tour mordi-e-fuggi o tappe forzate. Accompagno gruppi piccoli per offrire il tempo necessario a comprendere, apprezzare e vivere davvero l''arte e la storia del territorio con ritmi rilassati e guidati.', 'No rushed tours or forced stops. I guide small groups to give you the time needed to truly understand, appreciate, and experience the art and history of the region at an unhurried pace.', 'Testo banner slow'),

  ('about.subtitle', 'Profilo Professionale', 'Professional Profile', 'Sottotitolo about'),
  ('about.title', 'Prof. Davide Apolloni', 'Prof. Davide Apolloni', 'Titolo about'),
  ('about.expText', 'Anni di esperienza nella divulgazione storico-artistica', 'Years of experience in cultural & art history guided tours', 'Testo card anni'),
  ('about.btnCv', 'Leggi il Curriculum Vitae Completo', 'Read Full Curriculum Vitae', 'Bottone CV'),

  ('tours.subtitle', 'Esperienze & Itinerari', 'Experiences & Itineraries', 'Sottotitolo tour'),
  ('tours.title', 'I Nostri Percorsi Guidati', 'Our Guided Tours', 'Titolo tour'),
  ('tours.desc', 'Itinerari studiati per singoli, famiglie, piccoli gruppi o comitive in pullman, con il piacere del turismo lento e percorsi personalizzabili anche per appassionati di ciclismo e mototour.', 'Tailor-made itineraries for individuals, families, small groups, or bus tours, with the pleasure of slow tourism and special routes for cyclists and mototours.', 'Descrizione tour'),
  ('tours.btnMore', 'Scopri di più', 'Discover more', 'Bottone dettagli tour'),
  ('tours.btnBook', 'Prenota Tour', 'Book Tour', 'Bottone prenota tour'),

  ('events.subtitle', 'Prossime Partenze', 'Upcoming Dates', 'Sottotitolo eventi'),
  ('events.title', 'Eventi & Visite in Evidenza', 'Featured Events & Tours', 'Titolo eventi'),
  ('events.desc', 'Date speciali e visite a calendario per piccoli gruppi. Posti limitati per garantire un''esperienza culturale di qualità.', 'Special calendar visits for small groups. Limited availability to guarantee high cultural quality.', 'Descrizione eventi'),
  ('events.btnBook', 'Prenota questa data', 'Book this date', 'CTA evento'),
  ('events.badgeNext', 'Prossima Partenza', 'Next Departure', 'Badge evento'),
  ('events.badgeLast', 'Ultimi Posti', 'Last Spots', 'Badge evento'),
  ('events.badgeOpen', 'Iscrizioni Aperte', 'Open Registrations', 'Badge evento'),

  ('exclusive.subtitle', 'Visite Speciali', 'Special Visits', 'Sottotitolo esperienze'),
  ('exclusive.title', 'Esperienze Esclusive', 'Exclusive Experiences', 'Titolo esperienze'),
  ('exclusive.desc', 'Itinerari evocativi fuori dagli orari di afflusso di massa, disegnati per chi desidera assaporare l''arte e il paesaggio con la giusta calma ed eleganza.', 'Evocative off-peak itineraries designed for guests who wish to savor art and landscape with elegance and tranquility.', 'Descrizione esperienze'),
  ('exclusive.btn', 'Richiedi questa esperienza', 'Request this experience', 'CTA esperienza'),

  ('reviews.subtitle', 'Dicono di Noi', 'Testimonials', 'Sottotitolo recensioni'),
  ('reviews.title', 'Testimonianze dei Visitatori', 'What Visitors Say', 'Titolo recensioni'),
  ('reviews.formTitle', 'Lascia una Recensione', 'Leave a Review', 'Titolo form recensioni'),
  ('reviews.namePh', 'Il tuo nome', 'Your name', 'Placeholder nome recensione'),
  ('reviews.locationPh', 'La tua città/nazione (opzionale)', 'Your city/country (optional)', 'Placeholder città'),
  ('reviews.textPh', 'Condividi la tua esperienza...', 'Share your experience...', 'Placeholder testo'),
  ('reviews.ratingLabel', 'Valutazione', 'Rating', 'Label stelle'),
  ('reviews.submit', 'Invia Recensione', 'Submit Review', 'Bottone invio recensione'),
  ('reviews.success', 'Grazie! La tua recensione è stata inviata e sarà visibile dopo l''approvazione.', 'Thank you! Your review has been submitted and will be visible after approval.', 'Success recensione'),

  ('media.subtitle', 'Galleria & Esperienze', 'Gallery & Experiences', 'Sottotitolo media'),
  ('media.title', 'Scorci e Momenti sul Campo', 'Glimpses from the Field', 'Titolo media'),
  ('media.desc', 'Tutte le immagini del sito e i video testimoniano i luoghi straordinari che potrai scoprire lungo i nostri itinerari guidati.', 'Photos and videos showcasing the extraordinary sites you will discover during our guided tours.', 'Descrizione media'),

  ('form.subtitle', 'Pianifica la tua Visita', 'Plan Your Visit', 'Sottotitolo form'),
  ('form.title', 'Richiedi un Preventivo Personalizzato', 'Request a Custom Quote', 'Titolo form'),
  ('form.desc', 'Compila il modulo sottostante indicando le tue preferenze. Riceverai un''offerta su misura per singoli, gruppi, scuole o tour specifici entro 24-48 ore.', 'Fill out the form below with your preferences. You will receive a custom proposal for individuals, groups, schools, or custom tours within 24-48 hours.', 'Descrizione form'),
  ('form.name', 'Nome e Cognome', 'Full Name', 'Label nome'),
  ('form.phName', 'Mario Rossi', 'John Smith', 'Placeholder nome'),
  ('form.email', 'Indirizzo Email', 'Email Address', 'Label email'),
  ('form.phEmail', 'mario.rossi@email.com', 'john.smith@email.com', 'Placeholder email'),
  ('form.phone', 'Telefono / WhatsApp', 'Phone / WhatsApp', 'Label telefono'),
  ('form.phPhone', '+39 347 0000000', '+1 234 567 8900', 'Placeholder telefono'),
  ('form.category', 'Tipo di Tour', 'Tour Category', 'Label categoria'),
  ('form.catCitta', 'Città d''Arte (Veneto & Trentino)', 'Art Cities (Veneto & Trentino)', 'Option categoria'),
  ('form.catVille', 'Ville Venete & Castelli Trentini', 'Venetian Villas & Trentino Castles', 'Option categoria'),
  ('form.catGuerra', 'Grande Guerra 1915-1918', 'World War I 1915-1918', 'Option categoria'),
  ('form.catEsperienze', 'Esperienza Esclusiva (Notturna / Alba / Tramonto)', 'Exclusive Experience (Night / Sunrise / Sunset)', 'Option categoria'),
  ('form.catMisura', 'Itinerario Personalizzato / Su Misura', 'Tailor-Made Custom Itinerary', 'Option categoria'),
  ('form.destination', 'Destinazione Preferita', 'Preferred Destination', 'Label destinazione'),
  ('form.visitLang', 'Lingua della Visita', 'Tour Language', 'Label lingua'),
  ('form.langIt', 'Italiano', 'Italian', 'Option lingua'),
  ('form.langEn', 'Inglese (English)', 'English', 'Option lingua'),
  ('form.datePref', 'Data Preferita', 'Preferred Date', 'Label data'),
  ('form.dateAlt', 'Data Alternativa (Opzionale)', 'Alternative Date (Optional)', 'Label data alt'),
  ('form.participants', 'Numero Partecipanti', 'Number of Participants', 'Label partecipanti'),
  ('form.phPart', 'Es. 4', 'e.g. 4', 'Placeholder partecipanti'),
  ('form.transport', 'Modalità di Spostamento', 'Travel Mode', 'Label trasporto'),
  ('form.trFeet', 'A piedi (Walk tour)', 'On foot (Walking tour)', 'Option trasporto'),
  ('form.trBike', 'In Bicicletta / E-Bike', 'Bicycle / E-Bike', 'Option trasporto'),
  ('form.trMoto', 'In Moto / Scooter', 'Motorcycle / Scooter', 'Option trasporto'),
  ('form.trBus', 'Pullman / Gruppo Organizzato', 'Bus / Organized Group', 'Option trasporto'),
  ('form.notes', 'Note / Richieste Particolari', 'Notes / Special Requests', 'Label note'),
  ('form.phNotes', 'Indica eventuali esigenze specifiche, orari preferiti o dettagli del gruppo...', 'Specify any particular interest, schedule preferences, or group requirements...', 'Placeholder note'),
  ('form.gdpr', 'Autorizzo il trattamento dei dati personali ai sensi della normativa privacy (GDPR D.Lgs 196/2003 e Reg. UE 2016/679) esclusivamente per rispondere alla richiesta.', 'I authorize the processing of personal data in accordance with privacy laws (GDPR) exclusively to respond to this request.', 'Checkbox GDPR'),
  ('form.submit', 'Invia Richiesta di Preventivo', 'Send Quote Request', 'Bottone submit'),
  ('form.submitting', 'Invio in corso...', 'Sending...', 'Stato submitting'),
  ('form.success', 'Grazie! La tua richiesta è stata inviata con successo. Davide ti risponderà entro 24-48 ore.', 'Thank you! Your request has been sent successfully. Davide will get back to you within 24-48 hours.', 'Messaggio successo'),
  ('form.error', 'Si è verificato un errore durante l''invio del modulo. Riprova o invia una mail a guidaturistica@davideapolloni.it.', 'An error occurred while sending your request. Please try again or email guidaturistica@davideapolloni.it.', 'Messaggio errore'),

  ('contacts.subtitle', 'Invia una Mail o Chiama', 'Send an Email or Call', 'Sottotitolo contatti'),
  ('contacts.title', 'Contatti Diretti', 'Direct Contact Info', 'Titolo contatti'),
  ('contacts.desc', 'Per informazioni rapide, prenotazioni urgenti o collaborazioni istituzionali:', 'For quick inquiries, urgent bookings, or institutional collaborations:', 'Descrizione contatti'),
  ('contacts.emailLabel', 'Email Principale', 'Primary Email', 'Label email'),
  ('contacts.phoneLabel', 'Telefono / Cellulare', 'Phone / Mobile', 'Label telefono'),
  ('contacts.areaLabel', 'Area Operativa', 'Operating Region', 'Label area'),
  ('contacts.areaText', 'Regione Veneto & Provincia Autonoma di Trento', 'Veneto Region & Autonomous Province of Trentino', 'Testo area'),

  ('disc.title', 'Nota di Trasparenza sui Recapiti Storici', 'Note on Historical Contact Details', 'Titolo box discrepanza'),
  ('disc.text', 'Nel corso degli anni, sul vecchio sito web Weebly figuravano differenti indirizzi email (come info@ilproftiguida.com e davide@castlesandvillasontheroad.com) e recapiti telefonici. Il canale ufficiale unico di riferimento corrente per ogni comunicazione e prenotazione è l''indirizzo guidaturistica@davideapolloni.it.', 'Over the years, the old Weebly website displayed alternate emails (such as info@ilproftiguida.com and davide@castlesandvillasontheroad.com). The current official single contact address for all communications and bookings is guidaturistica@davideapolloni.it.', 'Testo box discrepanza'),

  ('cv.title', 'Curriculum Vitae', 'Curriculum Vitae', 'Titolo modal CV'),
  ('cv.sub', 'Curriculum Vitae Accademico & Professionale', 'Academic & Professional Curriculum Vitae', 'Sottotitolo modal CV'),
  ('cv.close', 'Chiudi', 'Close', 'Bottone chiusura modale'),

  ('footer.role', 'Guida Turistica Autorizzata & Accompagnatore Turistico', 'Authorized Tour Guide & Licensed Tour Leader', 'Footer ruolo'),
  ('footer.copyright', '© 2026 Davide Apolloni. Tutti i diritti riservati.', '© 2026 Davide Apolloni. All rights reserved.', 'Footer copyright'),
  ('footer.top', 'Torna in alto ↑', 'Back to Top ↑', 'Footer torna su'),

  ('common.loading', 'Caricamento...', 'Loading...', 'Stato loading generico'),
  ('common.error', 'Si è verificato un errore', 'An error occurred', 'Errore generico'),
  ('common.required', 'Campo obbligatorio', 'Required field', 'Validazione required'),
  ('common.invalidEmail', 'Inserisci un email valida', 'Enter a valid email', 'Validazione email')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- SEED DATA: MEDIA ITEMS (Galleria)
-- =============================================================================
INSERT INTO public.media_items (type, url, caption_it, caption_en, sort_order)
VALUES
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=grand%20canal%20venice%20at%20sunrise%20no%20crowds%20golden%20light%20editorial%20photography&image_size=landscape_16_9',
    'Venezia all''alba', 'Venice at sunrise', 1),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=palladian%20villa%20garden%20statue%20topiary%20sunlight%20terracotta%20olive%20tones%20veneto&image_size=landscape_16_9',
    'Ville Venete, giardini monumentali', 'Venetian Villas, monumental gardens', 2),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=medieval%20castle%20trentino%20alps%20autumn%20foliage%20stone%20fortress&image_size=landscape_16_9',
    'Castelli del Trentino', 'Trentino Castles', 3),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=wwi%20trench%20asiago%20stone%20fortification%20mountain%20landscape&image_size=landscape_16_9',
    'Trincee della Grande Guerra', 'WWI Trenches', 4),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=padova%20prato%20della%20valle%20elliptical%20square%20summer%20day&image_size=landscape_16_9',
    'Padova, Prato della Valle', 'Padua, Prato della Valle', 5),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vicenza%20palladian%20basilica%20piazza%20dei%20signori%20sunset&image_size=landscape_16_9',
    'Vicenza, Piazza dei Signori', 'Vicenza, Piazza dei Signori', 6),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=riviera%20del%20brenta%20canal%20villa%20autumn%20reflection%20water&image_size=landscape_16_9',
    'Riviera del Brenta', 'Brenta Riviera', 7),
  ('image', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=val%20di%20non%20apple%20orchards%20blooming%20spring%20trentino&image_size=landscape_16_9',
    'Val di Non, frutteti in fiore', 'Non Valley, blooming orchards', 8)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STORAGE: creazione bucket (da eseguire anche via dashboard o SQL insert)
-- Nota: in produzione usa anche l'SQL INSERT su storage.buckets
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', TRUE);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', TRUE);

-- =============================================================================
-- FUNZIONE RPC: get_public_profile() — helper per frontend
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_public_profile()
RETURNS TABLE (
  profile_id UUID,
  first_name TEXT, last_name TEXT, title TEXT,
  academic_badge TEXT, photo_url TEXT,
  bio_short TEXT, bio_long TEXT,
  operating_area TEXT, slow_tourism_claim TEXT,
  experience_years INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.first_name_it, p.last_name_it, p.title_it,
    p.academic_badge_it, p.photo_url,
    p.bio_short_it, p.bio_long_it,
    p.operating_area_it, p.slow_tourism_claim_it,
    p.experience_years
  FROM public.profiles p LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile() TO anon, authenticated;

-- =============================================================================
-- FINE MIGRAZIONE 000001
-- =============================================================================
