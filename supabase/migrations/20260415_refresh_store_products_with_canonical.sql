-- store_products_with_canonical uses SELECT sp.* — column list is fixed at CREATE VIEW time.
-- After ALTER TABLE adds columns (e.g. price_stats_*), recreate the view so sp.* matches the table.

DROP VIEW IF EXISTS public.store_products_with_canonical;
CREATE VIEW public.store_products_with_canonical
WITH (security_invoker = true) AS
SELECT
  sp.*,
  cm.canonical_category_id,
  cc.name AS canonical_category_name,
  cc.level AS canonical_level,
  cc.parent_id AS canonical_parent_id,
  cc_parent.name AS canonical_category_name_2,
  cc_parent.parent_id AS canonical_parent_id_2,
  cc_grandparent.name AS canonical_category_name_3
FROM public.store_products sp
LEFT JOIN public.category_mappings cm ON
  sp.origin_id = cm.origin_id
  AND sp.category = cm.store_category
  AND (
    (sp.category_2 IS NULL AND cm.store_category_2 IS NULL)
    OR sp.category_2 = cm.store_category_2
  )
  AND (
    (sp.category_3 IS NULL AND cm.store_category_3 IS NULL)
    OR sp.category_3 = cm.store_category_3
  )
LEFT JOIN public.canonical_categories cc ON cm.canonical_category_id = cc.id
LEFT JOIN public.canonical_categories cc_parent ON cc.parent_id = cc_parent.id
LEFT JOIN public.canonical_categories cc_grandparent ON cc_parent.parent_id = cc_grandparent.id;
