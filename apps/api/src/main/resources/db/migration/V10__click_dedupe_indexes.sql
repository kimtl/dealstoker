-- Support the per-product click de-duplication lookups (same session or IP
-- hash within a short window) without scanning all clicks of a product.
CREATE INDEX IF NOT EXISTS idx_click_events_product_session
    ON click_events (product_id, session_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_product_ip
    ON click_events (product_id, ip_hash, occurred_at DESC);
