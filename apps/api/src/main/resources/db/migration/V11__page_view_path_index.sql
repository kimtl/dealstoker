-- Per-path view counts (e.g. guide pages in the admin list).
CREATE INDEX idx_page_view_events_path ON page_view_events (path, occurred_at DESC);
