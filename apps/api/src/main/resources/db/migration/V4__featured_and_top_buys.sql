ALTER TABLE products
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN featured_rank INT NOT NULL DEFAULT 0;

CREATE INDEX idx_products_featured ON products (is_featured, featured_rank, published_at DESC);

-- Curate a few starter recommended deals for the frontpage.
UPDATE products SET is_featured = TRUE, featured_rank = 10
WHERE slug IN ('soundcore-life-q30-anc-headphones', 'hydro-flask-standard-mouth-bottle');

UPDATE products SET is_featured = TRUE, featured_rank = 20
WHERE slug = 'anker-737-power-bank-24k';

UPDATE products SET is_featured = TRUE, featured_rank = 30
WHERE slug IN ('cosori-12-in-1-air-fryer-oven', 'levoit-core-300-air-purifier');

-- Seed synthetic buy clicks so Top Buys is non-empty in local/demo.
INSERT INTO click_events (product_id, category_id, occurred_at, referrer, user_agent)
SELECT p.id, p.primary_category_id, NOW() - (gs.n || ' hours')::interval, 'seed', 'seed-agent'
FROM products p
JOIN LATERAL (
    SELECT n FROM generate_series(
        1,
        CASE p.slug
            WHEN 'soundcore-life-q30-anc-headphones' THEN 18
            WHEN 'hydro-flask-standard-mouth-bottle' THEN 14
            WHEN 'anker-737-power-bank-24k' THEN 11
            WHEN 'cosori-12-in-1-air-fryer-oven' THEN 9
            WHEN 'apple-airtag-4-pack' THEN 7
            WHEN 'ninja-crispi-portable-air-fryer' THEN 5
            ELSE 2
        END
    ) AS n
) gs ON TRUE
WHERE p.status = 'PUBLISHED';
