-- =============================================================================
-- 000005: TRANSPORT MODES DINAMICI E CORREZIONI
-- =============================================================================
-- - Crea tabella `transport_modes` con gestione CRUD da admin
-- - Converte `bookings.transport` da ENUM a TEXT (backward compatibile)
-- - Aggiunge colonna `places.transport_options` (prima era solo frontend)
-- - Inserisce seed `form.trCar` mancante in `ui_strings`
-- - RLS + Policies stile tour_types
-- =============================================================================

-- =============================================================================
-- 1. TABELLA TRANSPORT_MODES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#4A6535' NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_available_for_booking BOOLEAN DEFAULT TRUE NOT NULL,
  is_available_for_places BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger updated_at automatico
DROP TRIGGER IF EXISTS set_transport_modes_updated_at ON public.transport_modes;
CREATE TRIGGER set_transport_modes_updated_at
  BEFORE UPDATE ON public.transport_modes
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =============================================================================
-- 2. SEED INIZIALE TRANSPORT_MODES (5 valori base)
-- =============================================================================
INSERT INTO public.transport_modes
  (slug, name_it, name_en, description_it, description_en, icon_name, color, sort_order, is_active, is_available_for_booking, is_available_for_places)
VALUES
  (
    'walk',
    'A piedi',
    'On foot',
    'Tour pedonali nel centro storico',
    'Walking tours in the historic center',
    'Footprints',
    '#4A6535',
    0, TRUE, TRUE, TRUE
  ),
  (
    'bike',
    'In Bicicletta / E-Bike',
    'Bicycle / E-Bike',
    'Itinerari su due ruote nel verde',
    'Two-wheeled itineraries in the countryside',
    'Bike',
    '#3D6E90',
    1, TRUE, TRUE, TRUE
  ),
  (
    'moto',
    'In Moto / Scooter',
    'Motorcycle / Scooter',
    'Percorsi per motociclisti tra colline e montagne',
    'Motorcycle routes between hills and mountains',
    'Car',
    '#9C1C1C',
    2, TRUE, TRUE, TRUE
  ),
  (
    'car',
    'In Automobile propria',
    'By Private Car',
    'Tour con auto privata tra le localita piu distanti',
    'Tours with private car between distant locations',
    'CarFront',
    '#7A6655',
    3, TRUE, TRUE, TRUE
  ),
  (
    'bus',
    'Pullman / Gruppo Organizzato',
    'Bus / Organized Group',
    'Gruppi organizzati in pullman per scolaresche o associazioni',
    'Organized groups by bus for schools or associations',
    'Bus',
    '#C4923A',
    4, TRUE, TRUE, TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 3. CONVERSIONE bookings.transport DA ENUM A TEXT
--    Mantiene i valori esistenti, elimina il constraint enum rigido
-- =============================================================================
ALTER TABLE public.bookings
  ALTER COLUMN transport TYPE TEXT USING transport::text;

-- Drop enum type ormai inutilizzato se esiste (opzionale, safe)
-- DROP TYPE IF EXISTS public.transport_mode;

-- =============================================================================
-- 4. COLONNA places.transport_options
--    Esisteva solo nel frontend admin; ora persiste nel DB come TEXT[]
-- =============================================================================
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS transport_options TEXT[] DEFAULT ARRAY[]::TEXT[];

-- =============================================================================
-- 5. SEED MANCANTE: form.trCar IN ui_strings
-- =============================================================================
INSERT INTO public.ui_strings (key, value_it, value_en, label)
VALUES (
  'form.trCar',
  'In Automobile propria',
  'By Private Car',
  'Option trasporto auto'
)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 6. ROW LEVEL SECURITY E POLICIES
-- =============================================================================
ALTER TABLE public.transport_modes ENABLE ROW LEVEL SECURITY;

-- Pubblico e anonimi leggono solo i mezzi attivi
CREATE POLICY "Transport modes: public read active"
  ON public.transport_modes FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Admin autenticati possono fare tutto (CRUD)
CREATE POLICY "Transport modes: admin full access"
  ON public.transport_modes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 7. GRANT
-- =============================================================================
GRANT SELECT ON public.transport_modes TO anon, authenticated;
GRANT ALL ON public.transport_modes TO authenticated, service_role;
