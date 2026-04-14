-- Denormalized price history stats per store_product (refreshed by batch RPC).
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS price_stats_obs_90d integer,
  ADD COLUMN IF NOT EXISTS price_stats_cv_ln_90d double precision,
  ADD COLUMN IF NOT EXISTS price_stats_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_drop_smart_score double precision;

COMMENT ON COLUMN public.store_products.price_stats_obs_90d IS 'Count of price observations in the last 90 days (distinct prices rows)';
COMMENT ON COLUMN public.store_products.price_stats_cv_ln_90d IS 'Population stddev of ln(price) over last 90 days; 0 if insufficient data';
COMMENT ON COLUMN public.store_products.price_drop_smart_score IS 'Heuristic rank: larger = more trustworthy big drop; NULL if not a drop or thin history';

CREATE INDEX IF NOT EXISTS idx_sp_price_drop_smart_score
  ON public.store_products (price_drop_smart_score DESC NULLS LAST)
  WHERE available = true AND name IS NOT NULL AND name <> '' AND price IS NOT NULL;

-- Doc: ingest / pipeline review — last_http_status already on store_products; silent failures often leave bad price_change_pct or partial rows.

CREATE OR REPLACE FUNCTION public.refresh_store_product_price_stats_batch(p_batch_size integer DEFAULT 2000)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids bigint[];
  v_updated int := 0;
  v_window_start timestamptz := now() - interval '90 days';
BEGIN
  IF p_batch_size IS NULL OR p_batch_size < 1 THEN
    p_batch_size := 2000;
  END IF;

  SELECT coalesce(array_agg(s.id), ARRAY[]::bigint[])
  INTO v_ids
  FROM (
    SELECT sp.id
    FROM store_products sp
    WHERE sp.available = true
      AND EXISTS (
        SELECT 1
        FROM prices p
        WHERE p.store_product_id = sp.id
          AND p.price IS NOT NULL AND p.price > 0
          AND p.valid_from >= v_window_start
      )
      AND (
        sp.price_stats_updated_at IS NULL
        OR sp.updated_at > sp.price_stats_updated_at
        OR (sp.last_price_change_at IS NOT NULL AND sp.last_price_change_at > sp.price_stats_updated_at)
      )
    ORDER BY sp.id
    LIMIT p_batch_size
  ) s;

  IF cardinality(v_ids) = 0 THEN
    RETURN jsonb_build_object('processed', 0, 'batch_size', p_batch_size);
  END IF;

  WITH stats AS (
    SELECT
      p.store_product_id,
      count(*)::integer AS obs_90d,
      coalesce(stddev_pop(ln(p.price)), 0)::double precision AS cv_ln
    FROM prices p
    WHERE p.store_product_id = ANY (v_ids)
      AND p.price IS NOT NULL AND p.price > 0
      AND p.valid_from >= v_window_start
    GROUP BY p.store_product_id
  ),
  merged AS (
    SELECT
      sp.id,
      coalesce(st.obs_90d, 0) AS obs_90d,
      CASE
        WHEN st.obs_90d IS NULL OR st.obs_90d < 2 THEN 0::double precision
        ELSE st.cv_ln
      END AS cv_ln
    FROM store_products sp
    LEFT JOIN stats st ON st.store_product_id = sp.id
    WHERE sp.id = ANY (v_ids)
  ),
  upd AS (
    UPDATE store_products sp
    SET
      price_stats_obs_90d = m.obs_90d,
      price_stats_cv_ln_90d = m.cv_ln,
      price_stats_updated_at = now(),
      price_drop_smart_score =
        CASE
          WHEN sp.price_change_pct IS NOT NULL AND sp.price_change_pct < 0
            AND m.obs_90d >= 2 AND m.cv_ln > 1e-12
          THEN
            least(1::double precision, m.obs_90d::double precision / 8.0)
            * least(1::double precision, (m.cv_ln / 0.08)::double precision)
            * abs(sp.price_change_pct::double precision)
          WHEN sp.price_change_pct IS NOT NULL
            AND sp.price_change_pct < 0
            AND m.obs_90d >= 2 THEN
            least(1::double precision, m.obs_90d::double precision / 8.0)
            * 0.15::double precision
            * abs(sp.price_change_pct::double precision)
          ELSE NULL
        END
    FROM merged m
    WHERE sp.id = m.id
    RETURNING sp.id
  )
  SELECT count(*)::integer INTO v_updated FROM upd;

  RETURN jsonb_build_object(
    'processed', v_updated,
    'batch_size', p_batch_size,
    'candidate_ids', cardinality(v_ids)
  );
END;
$$;

ALTER FUNCTION public.refresh_store_product_price_stats_batch(integer) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.refresh_store_product_price_stats_batch(integer) TO service_role;
