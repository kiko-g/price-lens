-- Adds a per-user locale preference used by the i18n layer.
-- Values are constrained to the app's supported locales.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_locale_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_locale_check CHECK (locale IS NULL OR locale IN ('en', 'pt'));
