-- Brand Control Center: key/value app settings (first key: `brand`).
-- Public read (brand strings are rendered for logged-out shoppers); writes go through the
-- service role from /api/admin/brand, which is gated by the admin-role middleware.

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for anon" ON app_settings
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read for authenticated" ON app_settings
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies: only the service role can write.

-- Seed the brand row so the admin editor has something to load; values mirror
-- BRAND_DEFAULTS in src/lib/brand/brand.ts and can be edited from /admin/brand.
INSERT INTO app_settings (key, value)
VALUES (
  'brand',
  jsonb_build_object(
    'displayName', 'Lince',
    'shortName', 'Lince',
    'legalName', 'Lince',
    'tagline', jsonb_build_object(
      'pt', 'O pulso dos preços dos supermercados em Portugal.',
      'en', 'The pulse of supermarket prices in Portugal.'
    ),
    'metaDescription', jsonb_build_object(
      'pt', 'Monitorização diária de preços dos supermercados portugueses (Continente, Auchan e Pingo Doce). Vê o que muda, compra no momento certo e revela quanto poupas.',
      'en', 'Daily price monitoring for Portuguese supermarkets (Continente, Auchan and Pingo Doce). See what changes, buy at the right time and reveal how much you save.'
    )
  )
)
ON CONFLICT (key) DO NOTHING;
