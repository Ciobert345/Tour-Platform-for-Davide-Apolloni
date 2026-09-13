-- =============================================================================
-- FIX: is_admin() accettava solo role = 'admin', ma la guida setup inseriva
-- 'super_admin'. Le policy RLS bloccavano quindi tutte le scritture admin.
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
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
