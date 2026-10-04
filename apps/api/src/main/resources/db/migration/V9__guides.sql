-- Editorial buying guides / columns: one URL per article (/guides/{slug}).
CREATE TABLE guides (
    id                BIGSERIAL PRIMARY KEY,
    slug              VARCHAR(220) NOT NULL UNIQUE,
    title             VARCHAR(300) NOT NULL,
    excerpt           VARCHAR(600),
    body              TEXT NOT NULL,
    title_ko          VARCHAR(300),
    excerpt_ko        VARCHAR(600),
    body_ko           TEXT,
    category_id       BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    cover_image_url   TEXT,
    author_name       VARCHAR(120),
    status            VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    seo_title         VARCHAR(255),
    seo_description   VARCHAR(500),
    published_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guides_status_published ON guides (status, published_at DESC);
CREATE INDEX idx_guides_category ON guides (category_id, published_at DESC);
