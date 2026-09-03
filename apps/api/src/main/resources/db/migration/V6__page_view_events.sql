CREATE TABLE page_view_events (
    id           BIGSERIAL PRIMARY KEY,
    path         VARCHAR(500) NOT NULL,
    product_id   BIGINT REFERENCES products (id) ON DELETE SET NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer     TEXT,
    user_agent   TEXT,
    ip_hash      VARCHAR(128),
    visitor_key  VARCHAR(128),
    session_key  VARCHAR(128)
);

CREATE INDEX idx_page_view_events_occurred ON page_view_events (occurred_at DESC);
CREATE INDEX idx_page_view_events_product ON page_view_events (product_id, occurred_at DESC);
CREATE INDEX idx_page_view_events_visitor ON page_view_events (visitor_key, occurred_at DESC);
CREATE INDEX idx_page_view_events_session ON page_view_events (session_key, occurred_at DESC);
