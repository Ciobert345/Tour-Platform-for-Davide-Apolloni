-- =============================================================================
-- 000006: SEZIONE MAPPA (/mappa)
-- =============================================================================
-- Migrazione SOLO ADDITIVA: nessun DROP, nessun RENAME, nessuna modifica a
-- colonne o vincoli esistenti. Tutte le colonne aggiunte a tabelle esistenti
-- sono nullable oppure hanno un DEFAULT. Idempotente: si può rieseguire.
--
-- Cosa fa:
--   1. places        -> aggiunge lat / lng (coordinate dei luoghi)
--   2. map_spots     -> NUOVA tabella: mete "proposte" dall'admin (solo mappa)
--   3. reviews       -> aggiunge place_id / map_spot_id (luogo della visita)
--   4. bookings      -> aggiunge source, map_lat, map_lng, place_id, map_spot_id
--   5. ui_strings    -> microcopy IT/EN della mappa (chiavi 'map.*' e 'nav.map')
--
-- COME APPLICARLA: SQL Editor della dashboard Supabase (incolla tutto ed
-- esegui). NON usare `supabase db push` (esistono due file 000002).
-- PRIMA: fai un backup / branch del database.
--
-- ROLLBACK: vedi blocco commentato in fondo al file.
-- =============================================================================
-- Nota sul trigger updated_at:
--   Lo schema iniziale (000001) definisce public.handle_updated_at().
--   000005 usa public.set_current_timestamp_updated_at() su transport_modes.
--   Qui si usa handle_updated_at() per allinearsi a places/bookings/ui_strings.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PLACES: coordinate
-- -----------------------------------------------------------------------------
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6) CHECK (lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6) CHECK (lng BETWEEN -180 AND 180);

-- lat e lng vanno sempre insieme: o entrambe valorizzate o entrambe NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'places_lat_lng_pair_chk'
      AND conrelid = 'public.places'::regclass
  ) THEN
    ALTER TABLE public.places
      ADD CONSTRAINT places_lat_lng_pair_chk
      CHECK ((lat IS NULL) = (lng IS NULL));
  END IF;
END $$;

-- Indice parziale: solo i luoghi che hanno coordinate (quelli mostrati in mappa)
CREATE INDEX IF NOT EXISTS idx_places_with_coords
  ON public.places (lat, lng)
  WHERE lat IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. MAP_SPOTS: mete proposte (NON compaiono nella sezione Tour della home)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.map_spots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT NOT NULL UNIQUE,
  name_it              TEXT NOT NULL,
  name_en              TEXT NOT NULL,
  short_description_it TEXT,
  short_description_en TEXT,
  long_description_it  TEXT,
  long_description_en  TEXT,
  lat                  NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng                  NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -180 AND 180),
  cover_image_url      TEXT,
  tour_type_id         UUID REFERENCES public.tour_types(id) ON DELETE SET NULL,
  place_id             UUID REFERENCES public.places(id)     ON DELETE SET NULL,
  sort_order           INTEGER     NOT NULL DEFAULT 0,
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_spots_is_active    ON public.map_spots (is_active);
CREATE INDEX IF NOT EXISTS idx_map_spots_tour_type_id ON public.map_spots (tour_type_id);
CREATE INDEX IF NOT EXISTS idx_map_spots_place_id     ON public.map_spots (place_id);

-- updated_at automatico (funzione definita in 000001)
DROP TRIGGER IF EXISTS trg_map_spots_updated_at ON public.map_spots;
CREATE TRIGGER trg_map_spots_updated_at
  BEFORE UPDATE ON public.map_spots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.map_spots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Map spots: public read active" ON public.map_spots;
CREATE POLICY "Map spots: public read active"
  ON public.map_spots FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Map spots: admin full access" ON public.map_spots;
CREATE POLICY "Map spots: admin full access"
  ON public.map_spots FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GRANT espliciti (le default privileges del progetto darebbero INSERT ad anon:
-- lo revochiamo, i visitatori possono solo LEGGERE)
REVOKE ALL ON TABLE public.map_spots FROM anon;
GRANT SELECT ON TABLE public.map_spots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.map_spots TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. REVIEWS: luogo della visita (opzionale)
-- -----------------------------------------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS place_id    UUID REFERENCES public.places(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS map_spot_id UUID REFERENCES public.map_spots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_place_id
  ON public.reviews (place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_map_spot_id
  ON public.reviews (map_spot_id) WHERE map_spot_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. BOOKINGS: origine della richiesta e punto scelto sulla mappa
-- -----------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source      TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'map')),
  ADD COLUMN IF NOT EXISTS map_lat     NUMERIC(9,6) CHECK (map_lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS map_lng     NUMERIC(9,6) CHECK (map_lng BETWEEN -180 AND 180),
  ADD COLUMN IF NOT EXISTS place_id    UUID REFERENCES public.places(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS map_spot_id UUID REFERENCES public.map_spots(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_map_lat_lng_pair_chk'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_map_lat_lng_pair_chk
      CHECK ((map_lat IS NULL) = (map_lng IS NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_source
  ON public.bookings (source) WHERE source <> 'form';
CREATE INDEX IF NOT EXISTS idx_bookings_place_id
  ON public.bookings (place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_map_spot_id
  ON public.bookings (map_spot_id) WHERE map_spot_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. UI_STRINGS: microcopy della mappa (IT / EN)
--    ON CONFLICT DO NOTHING: non sovrascrive testi già modificati da admin
-- -----------------------------------------------------------------------------
INSERT INTO public.ui_strings (key, it, en, description) VALUES
  ('nav.map', 'Mappa', 'Map', 'Voce di menu: mappa'),

  ('map.pageTitle', 'Mappa dei luoghi', 'Places map', 'Mappa: titolo pagina'),
  ('map.pageSubtitle', 'Esplora il Veneto e il Trentino', 'Explore Veneto and Trentino', 'Mappa: sottotitolo pagina'),
  ('map.pageDesc',
   'Scopri i luoghi delle visite guidate, le mete proposte e le recensioni. Clicca su un punto della mappa per richiedere una visita personalizzata.',
   'Discover the places of the guided tours, suggested destinations and reviews. Click a point on the map to request a custom visit.',
   'Mappa: descrizione pagina'),
  ('map.backToSite', 'Torna al sito', 'Back to the site', 'Mappa: link di ritorno'),
  ('map.bookCta', 'Prenota', 'Book', 'Mappa: pulsante header'),
  ('map.close', 'Chiudi', 'Close', 'Mappa: chiudi pannello'),

  ('map.filters', 'Filtri', 'Filters', 'Mappa: titolo filtri'),
  ('map.filterAllTours', 'Tutti i tour', 'All tours', 'Mappa: filtro tipo tour'),
  ('map.filterPlaces', 'Luoghi delle visite', 'Tour places', 'Mappa: filtro luoghi'),
  ('map.filterSpots', 'Mete proposte', 'Suggested destinations', 'Mappa: filtro mete proposte'),
  ('map.filterReviewed', 'Solo con recensioni', 'With reviews only', 'Mappa: filtro recensioni'),

  ('map.legend', 'Legenda', 'Legend', 'Mappa: titolo legenda'),
  ('map.legendPlace', 'Luogo delle visite', 'Tour place', 'Mappa: legenda luogo'),
  ('map.legendSpot', 'Meta proposta', 'Suggested destination', 'Mappa: legenda meta proposta'),
  ('map.legendReviews', 'Con recensioni', 'With reviews', 'Mappa: legenda recensioni'),

  ('map.duration', 'Durata', 'Duration', 'Mappa: etichetta durata'),
  ('map.difficulty', 'Difficoltà', 'Difficulty', 'Mappa: etichetta difficoltà'),
  ('map.viewDetails', 'Vedi la scheda', 'View details', 'Mappa: link scheda luogo'),
  ('map.bookHere', 'Prenota una visita qui', 'Book a visit here', 'Mappa: pulsante prenota su luogo'),

  ('map.reviews', 'Recensioni', 'Reviews', 'Mappa: titolo recensioni'),
  ('map.reviewsLabel', 'recensioni', 'reviews', 'Mappa: parola "recensioni" accanto al conteggio'),
  ('map.noReviews', 'Nessuna recensione ancora', 'No reviews yet', 'Mappa: nessuna recensione'),

  ('map.customVisitCta', 'Richiedi una visita personalizzata qui', 'Request a custom visit here', 'Mappa: pulsante su punto libero'),
  ('map.outOfArea', 'Fuori dalla zona di operatività', 'Outside the service area', 'Mappa: click fuori area'),
  ('map.outOfAreaDesc',
   'Davide organizza visite in Veneto e nella provincia di Trento. Scegli un punto all''interno dell''area evidenziata.',
   'Davide organizes visits in Veneto and in the province of Trento. Please choose a point inside the highlighted area.',
   'Mappa: spiegazione click fuori area'),
  ('map.locating', 'Sto cercando il luogo…', 'Looking up the place…', 'Mappa: caricamento reverse geocoding'),
  ('map.placeUnknown', 'Luogo senza nome', 'Unnamed place', 'Mappa: fallback nome luogo'),
  ('map.geoError',
   'Non è stato possibile recuperare le informazioni del luogo. Riprova tra poco.',
   'We could not retrieve the place information. Please try again shortly.',
   'Mappa: errore reverse geocoding'),

  ('map.photos', 'Foto', 'Photos', 'Mappa: titolo foto'),
  ('map.photosLoading', 'Carico le foto…', 'Loading photos…', 'Mappa: caricamento foto'),
  ('map.noPhotos', 'Nessuna foto trovata per questa zona.', 'No photos found for this area.', 'Mappa: nessuna foto'),
  ('map.photoCredit', 'Foto da Wikimedia Commons', 'Photos from Wikimedia Commons', 'Mappa: credito fonte foto'),
  ('map.photoBy', 'Foto di', 'Photo by', 'Mappa: credito autore foto'),

  ('map.selectedPlace', 'Luogo selezionato', 'Selected place', 'Form: riepilogo luogo da mappa'),
  ('map.removeSelected', 'Rimuovi luogo', 'Remove place', 'Form: rimuovi luogo da mappa'),
  ('map.drawerTitle', 'Richiedi una visita', 'Request a visit', 'Mappa: titolo drawer prenotazione'),

  ('map.reviewPlaceLabel', 'Luogo visitato (facoltativo)', 'Place visited (optional)', 'Form recensione: luogo'),
  ('map.reviewPlaceNone', 'Nessun luogo specifico', 'No specific place', 'Form recensione: nessun luogo')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Ricarica la cache dello schema di PostgREST (API di Supabase)
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- ROLLBACK (ESEGUIRE SOLO SE SERVE TORNARE INDIETRO) — decommenta ed esegui
-- ATTENZIONE: elimina i dati inseriti nelle colonne/tabella create da questa
-- migrazione (coordinate dei luoghi, mete proposte, luogo delle recensioni,
-- origine/coordinate delle prenotazioni da mappa). I dati preesistenti non
-- vengono toccati.
-- =============================================================================
-- BEGIN;
--
-- DELETE FROM public.ui_strings WHERE key LIKE 'map.%' OR key = 'nav.map';
--
-- DROP INDEX IF EXISTS public.idx_bookings_map_spot_id;
-- DROP INDEX IF EXISTS public.idx_bookings_place_id;
-- DROP INDEX IF EXISTS public.idx_bookings_source;
-- ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_map_lat_lng_pair_chk;
-- ALTER TABLE public.bookings
--   DROP COLUMN IF EXISTS map_spot_id,
--   DROP COLUMN IF EXISTS place_id,
--   DROP COLUMN IF EXISTS map_lng,
--   DROP COLUMN IF EXISTS map_lat,
--   DROP COLUMN IF EXISTS source;
--
-- DROP INDEX IF EXISTS public.idx_reviews_map_spot_id;
-- DROP INDEX IF EXISTS public.idx_reviews_place_id;
-- ALTER TABLE public.reviews
--   DROP COLUMN IF EXISTS map_spot_id,
--   DROP COLUMN IF EXISTS place_id;
--
-- DROP TABLE IF EXISTS public.map_spots;
--
-- DROP INDEX IF EXISTS public.idx_places_with_coords;
-- ALTER TABLE public.places DROP CONSTRAINT IF EXISTS places_lat_lng_pair_chk;
-- ALTER TABLE public.places
--   DROP COLUMN IF EXISTS lng,
--   DROP COLUMN IF EXISTS lat;
--
-- NOTIFY pgrst, 'reload schema';
-- COMMIT;
