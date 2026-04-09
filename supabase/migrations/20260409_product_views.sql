-- Product view tracking (lightweight, aggregated daily)
CREATE TABLE IF NOT EXISTS public.product_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_product_id bigint NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Indexes for efficient aggregation
CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.product_views(store_product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON public.product_views(view_date);
CREATE INDEX IF NOT EXISTS idx_product_views_user_date ON public.product_views(user_id, view_date) WHERE user_id IS NOT NULL;

-- Daily aggregated view counts (materialized for performance)
CREATE TABLE IF NOT EXISTS public.product_view_counts (
  store_product_id bigint NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  view_date date NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (store_product_id, view_date)
);

-- RLS: views are insertable by anyone, readable by admins
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_view_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert product views"
  ON public.product_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read product views"
  ON public.product_views
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read view counts"
  ON public.product_view_counts
  FOR SELECT
  USING (true);
