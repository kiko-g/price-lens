-- Lock `profiles.role` against self-escalation.
--
-- RLS policy "Users can update their own profile." lets any authenticated user UPDATE
-- their own profiles row, and the `authenticated` DB role holds table-level UPDATE on
-- profiles. Without this guard a shopper (or the read-only reviewer) could call
-- PATCH /rest/v1/profiles?id=eq.<uid> {"role":"admin"} with their own JWT and become
-- an admin. Roles must only be assigned by the service role (seed scripts, SQL editor).
--
-- Implemented as a SECURITY INVOKER trigger so `current_user` is the PostgREST role
-- (`anon` / `authenticated` / `service_role`) rather than the function owner.

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'profiles.role can only be changed by the service role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;

CREATE TRIGGER protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

COMMENT ON FUNCTION public.protect_profile_role() IS
  'Blocks anon/authenticated callers from changing profiles.role (privilege escalation guard).';
