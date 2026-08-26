UPDATE products SET list_price = ROUND(price_amount * 1.45, 2)
WHERE price_amount IS NOT NULL AND list_price IS NULL;
