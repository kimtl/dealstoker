CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    parent_id       BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) NOT NULL UNIQUE,
    description     TEXT,
    seo_title       VARCHAR(255),
    seo_description VARCHAR(500),
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id                 BIGSERIAL PRIMARY KEY,
    source             VARCHAR(40) NOT NULL DEFAULT 'AMAZON',
    external_id        VARCHAR(64) NOT NULL,
    marketplace        VARCHAR(64) NOT NULL DEFAULT 'www.amazon.com',
    title              VARCHAR(500) NOT NULL,
    slug               VARCHAR(540) NOT NULL UNIQUE,
    description        TEXT,
    image_url          TEXT,
    price_amount       NUMERIC(12, 2),
    currency           VARCHAR(8) NOT NULL DEFAULT 'USD',
    list_price         NUMERIC(12, 2),
    availability       VARCHAR(80),
    rating             NUMERIC(3, 2),
    review_count       INT,
    detail_page_url    TEXT NOT NULL,
    brand              VARCHAR(200),
    features_json      TEXT,
    status             VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    seo_title          VARCHAR(255),
    seo_description    VARCHAR(500),
    primary_category_id BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    published_at       TIMESTAMPTZ,
    last_synced_at     TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_source_external_marketplace UNIQUE (source, external_id, marketplace)
);

CREATE INDEX idx_products_status_published ON products (status, published_at DESC);
CREATE INDEX idx_products_primary_category ON products (primary_category_id);

CREATE TABLE product_categories (
    product_id  BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE click_events (
    id           BIGSERIAL PRIMARY KEY,
    product_id   BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    category_id  BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer     TEXT,
    user_agent   TEXT,
    ip_hash      VARCHAR(128),
    session_id   VARCHAR(128),
    utm_source   VARCHAR(120),
    utm_medium   VARCHAR(120),
    utm_campaign VARCHAR(120)
);

CREATE INDEX idx_click_events_occurred ON click_events (occurred_at DESC);
CREATE INDEX idx_click_events_product ON click_events (product_id, occurred_at DESC);

CREATE TABLE slug_redirects (
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(40) NOT NULL,
    old_slug    VARCHAR(540) NOT NULL,
    new_slug    VARCHAR(540) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_slug_redirect UNIQUE (entity_type, old_slug)
);
