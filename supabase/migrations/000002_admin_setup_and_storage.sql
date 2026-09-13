-- =============================================================================
-- MIGRAZIONE 000002: ADMIN SETUP + STORAGE BUCKETS + RLS SU STORAGE
-- Eseguire DOPO aver creato l'utente admin via Supabase Auth Dashboard
-- (email: davide@tuodominio.it, password: scelta da Davide)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROMUOVI UTENTE ADMIN (sostituisci con la user.id vera!)
--    Usa: SELECT id FROM auth.users WHERE email = 'guidaturistica@davideapolloni.it';
-- -----------------------------------------------------------------------------
-- Esempio:
-- INSERT INTO public.admin_roles (user_id, role)
-- VALUES ('<UUID-UTENTE-DAVIDE>', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;

-- Query per ispezionare gli ID utente da usare nella INSERT sopra:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- -----------------------------------------------------------------------------
-- 2. STORAGE BUCKETS (media e uploads — pubblici)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'media',
    'media',
    TRUE,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
  ),
  (
    'uploads',
    'uploads',
    TRUE,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. RLS SU STORAGE (oggetti)
-- -----------------------------------------------------------------------------
-- Abilita RLS per gli oggetti
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere oggetti pubblici (anon e auth)
CREATE POLICY "Storage: public read media and uploads buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('media', 'uploads'));

-- Policy: solo admin può inserire/caricare
CREATE POLICY "Storage: admin can insert media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('media', 'uploads')
    AND public.is_admin() = TRUE
  );

-- Policy: solo admin può aggiornare
CREATE POLICY "Storage: admin can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('media', 'uploads')
    AND public.is_admin() = TRUE
  )
  WITH CHECK (
    bucket_id IN ('media', 'uploads')
    AND public.is_admin() = TRUE
  );

-- Policy: solo admin può cancellare
CREATE POLICY "Storage: admin can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('media', 'uploads')
    AND public.is_admin() = TRUE
  );

-- =============================================================================
-- 4. EDGE FUNCTIONS — note infrastrutturali (deploy CLI):
-- =============================================================================
-- Da CLI Supabase (dopo aver scritto le funzioni in supabase/functions/):
--   supabase functions deploy notify-new-booking --no-verify-jwt
--   supabase functions deploy confirm-booking-received --no-verify-jwt
--
-- Trigger DB per invocare le edge function su nuova prenotazione:
--   (vedi migration 000003_triggers_and_webhooks.sql)
-- =============================================================================
