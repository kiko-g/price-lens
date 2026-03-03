-- How many distinct barcodes exist in store_products?
SELECT COUNT(DISTINCT barcode) FROM store_products WHERE barcode IS NOT NULL;

-- How many store_products still have no trade_item_id (weren't linked)?
SELECT COUNT(*) FROM store_products WHERE barcode IS NOT NULL AND trade_item_id IS NULL;

-- How many trade_items exist?
SELECT COUNT(*) FROM trade_items;