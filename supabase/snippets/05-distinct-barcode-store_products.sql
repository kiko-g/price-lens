SELECT COUNT(DISTINCT barcode) 
FROM store_products 
WHERE barcode IS NOT NULL AND barcode != '';