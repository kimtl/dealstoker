-- Editor-picked guides lead the magazine-style homepage (lower rank first).
ALTER TABLE guides ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE guides ADD COLUMN featured_rank INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_guides_home ON guides (status, featured DESC, featured_rank, published_at DESC);
