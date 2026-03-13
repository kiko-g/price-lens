-- Migration: Triage "park" behavior for unmapped categories
-- Instead of vetoing products with no category mapping, park them with priority=0
-- so they can be re-evaluated after mappings are created.

-- 1. Add 'unmapped' to priority_source_type enum
ALTER TYPE priority_source_type ADD VALUE IF NOT EXISTS 'unmapped';

-- 2. Clear incorrectly vetoed Pingo Doce SKUs from the premature triage run
DELETE FROM vetoed_store_skus;
