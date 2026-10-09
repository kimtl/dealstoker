-- Email newsletter: double opt-in subscribers and weekly issues.
CREATE TABLE subscribers (
    id                 BIGSERIAL PRIMARY KEY,
    email              VARCHAR(254) NOT NULL UNIQUE,
    status             VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    locale             VARCHAR(8)   NOT NULL DEFAULT 'en',
    token              VARCHAR(64)  NOT NULL UNIQUE,
    source             VARCHAR(64),
    confirmation_sent_at TIMESTAMPTZ,
    confirmed_at       TIMESTAMPTZ,
    unsubscribed_at    TIMESTAMPTZ,
    last_sent_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscribers_status ON subscribers (status);

CREATE TABLE newsletter_issues (
    id               BIGSERIAL PRIMARY KEY,
    subject          VARCHAR(200) NOT NULL,
    subject_ko       VARCHAR(200),
    intro            TEXT,
    intro_ko         TEXT,
    content_json     TEXT         NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    recipient_count  INTEGER      NOT NULL DEFAULT 0,
    sent_count       INTEGER      NOT NULL DEFAULT 0,
    failed_count     INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sent_at          TIMESTAMPTZ
);
CREATE INDEX idx_newsletter_issues_created ON newsletter_issues (created_at DESC);
