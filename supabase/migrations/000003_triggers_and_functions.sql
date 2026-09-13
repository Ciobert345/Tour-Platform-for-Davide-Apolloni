-- =============================================================================
-- MIGRAZIONE 000003: TRIGGER DB per NOTIFICHE (Edge Functions via HTTP)
-- Deploya prima le Edge Functions, poi questo file.
--
-- Edge Functions richieste (supabase/functions/):
--   - notify-new-booking   → POST email a Davide (Resend/SMTP)
--   - confirm-booking-received → POST email conferma all'utente
--   - notify-review-pending → POST notifica a Davide nuova recensione in attesa
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FUNZIONE: trigger per NUOVA PRENOTAZIONE (bookings AFTER INSERT)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'booking_id', NEW.id,
    'full_name', NEW.full_name,
    'email', NEW.email,
    'phone', NEW.phone,
    'participants', NEW.participants,
    'visit_language', NEW.visit_language,
    'preferred_date', NEW.preferred_date,
    'transport', NEW.transport,
    'notes', NEW.notes,
    'status', NEW.status,
    'created_at', NEW.created_at
  );

  -- Notifica ADMIN via Edge Function
  -- (Deploy: supabase functions deploy notify-new-booking --no-verify-jwt)
  PERFORM
    net.http_post(
      url := (SELECT COALESCE(
        (SELECT value FROM secrets.decrypted_secret WHERE name = 'SUPABASE_FUNCTIONS_URL' LIMIT 1),
        current_setting('app.functions_url', true)
      )) || '/functions/v1/notify-new-booking',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := payload::jsonb
    );

  -- CONFERMA UTENTE via Edge Function
  PERFORM
    net.http_post(
      url := (SELECT COALESCE(
        (SELECT value FROM secrets.decrypted_secret WHERE name = 'SUPABASE_FUNCTIONS_URL' LIMIT 1),
        current_setting('app.functions_url', true)
      )) || '/functions/v1/confirm-booking-received',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := payload::jsonb
    );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Non fallire la transazione per errore nell'invio email
  RAISE WARNING 'handle_new_booking failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_after_insert
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_booking();

-- -----------------------------------------------------------------------------
-- 2. FUNZIONE: trigger per NUOVA RECENSIONE (reviews AFTER INSERT pending)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_review_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload JSON;
BEGIN
  IF NEW.status = 'pending' THEN
    payload := json_build_object(
      'review_id', NEW.id,
      'author_name', NEW.author_name,
      'author_location', NEW.author_location_it,
      'review_text', NEW.review_text,
      'rating', NEW.rating,
      'submitted_at', NEW.submitted_at
    );

    PERFORM
      net.http_post(
        url := (SELECT COALESCE(
          (SELECT value FROM secrets.decrypted_secret WHERE name = 'SUPABASE_FUNCTIONS_URL' LIMIT 1),
          current_setting('app.functions_url', true)
        )) || '/functions/v1/notify-review-pending',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
          'Content-Type', 'application/json'
        ),
        body := payload::jsonb
      );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_review_pending failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_after_insert_pending
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_review_pending();

-- =============================================================================
-- FINE MIGRAZIONE 000003
-- =============================================================================
