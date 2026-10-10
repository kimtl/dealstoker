-- One confirmed price per product per US Eastern day (the last one seen that day wins).
-- Filled by the daily price refresh, Amazon resyncs and manual price edits; it backs the
-- price chart and the "is this a good price?" note on product pages.
CREATE TABLE product_price_history (
    product_id   BIGINT        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    observed_on  DATE          NOT NULL,
    price_amount NUMERIC(12, 2) NOT NULL,
    list_price   NUMERIC(12, 2),
    currency     VARCHAR(8)    NOT NULL DEFAULT 'USD',
    recorded_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, observed_on)
);

-- Start every product's history with the price it has now, dated when it was last confirmed.
INSERT INTO product_price_history (product_id, observed_on, price_amount, list_price, currency, recorded_at)
SELECT id,
       (COALESCE(last_synced_at, created_at) AT TIME ZONE 'America/New_York')::date,
       price_amount,
       list_price,
       COALESCE(currency, 'USD'),
       COALESCE(last_synced_at, created_at)
FROM products
WHERE price_amount IS NOT NULL;
