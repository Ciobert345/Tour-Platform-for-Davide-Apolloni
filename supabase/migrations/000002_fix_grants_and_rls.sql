-- =============================================================================
-- FIX DB: GRANT PRIVILEGI + RLS FINE TUNING
-- =============================================================================
-- Problema iniziale: dopo "ALTER TABLE ... ENABLE ROW LEVEL SECURITY",
-- i ruoli anon/authenticated NON avevano alcun GRANT base sulle tabelle,
-- quindi QUALSIASI select/insert dal sito falliva con errore 42501.
--
-- Applica SQL con:
--   supabase db reset --local  (se hai Supabase CLI)
--   oppure copia/incolla in SQL Editor di Supabase Dashboard
-- =============================================================================

-- 1. SCHEMA public USAGE obbligatorio
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. GRANT SELECT (lettura) su TUTTE le tabelle pubbliche
GRANT SELECT ON TABLE public.admin_roles          TO authenticated; -- solo admin lo leggerà via policy
GRANT SELECT ON TABLE public.profiles             TO anon, authenticated;
GRANT SELECT ON TABLE public.contacts             TO anon, authenticated;
GRANT SELECT ON TABLE public.credentials          TO anon, authenticated;
GRANT SELECT ON TABLE public.cv_items             TO anon, authenticated;
GRANT SELECT ON TABLE public.tour_types           TO anon, authenticated;
GRANT SELECT ON TABLE public.place_types          TO anon, authenticated;
GRANT SELECT ON TABLE public.places               TO anon, authenticated;
GRANT SELECT ON TABLE public.place_tour_types     TO anon, authenticated;
GRANT SELECT ON TABLE public.events               TO anon, authenticated;
GRANT SELECT ON TABLE public.event_places         TO anon, authenticated;
GRANT SELECT ON TABLE public.info_items           TO anon, authenticated;
GRANT SELECT ON TABLE public.reviews              TO anon, authenticated;
GRANT SELECT ON TABLE public.bookings             TO authenticated; -- SOLO ADMIN legge (vedi policy)
GRANT SELECT ON TABLE public.ui_strings           TO anon, authenticated;
GRANT SELECT ON TABLE public.quotes               TO anon, authenticated;
GRANT SELECT ON TABLE public.media_items          TO anon, authenticated;

-- 3. GRANT INSERT (scrittura pubblica)
GRANT INSERT ON TABLE public.reviews              TO anon, authenticated;
GRANT INSERT ON TABLE public.bookings             TO anon, authenticated;

-- 4. GRANT UPDATE / DELETE — RISERVATO AD AUTHENTICATED (le policies admin filtreranno poi)
GRANT UPDATE, DELETE ON TABLE public.profiles     TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.contacts     TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.credentials  TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.cv_items     TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.tour_types   TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.place_types  TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.places       TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.place_tour_types  TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.events       TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.event_places TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.info_items   TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.reviews      TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.bookings     TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.ui_strings   TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.quotes       TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.media_items  TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.admin_roles  TO authenticated;

-- 5. GRANT USAGE / SELECT sulle sequence (se usate)
--    (per id UUID DEFAULT gen_random_uuid() NON servono, ma safety net)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. GRANT EXECUTE funzioni pubbliche (se ne aggiungi dopo)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 7. Default privileges per FUTURE tabelle (in caso di alter)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
