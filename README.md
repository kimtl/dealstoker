# DealStoker

US-focused affiliate marketing site for [dealstoker.com](https://dealstoker.com) — category-based Amazon.com product curation, SEO pages, click tracking, and admin catalog tools.

**Stack:** Spring Boot API + Next.js (React SSR)  
**Market:** United States (Amazon.com, en-US, USD)

## Repository layout

```text
apps/
  api/    Spring Boot 4 catalog + admin + /go redirect
  web/    Next.js public site + admin UI
docs/
  business-analysis/
  adr/
docker-compose.yml
```

## Quick start (local)

### 1) Database

With Docker:

```bash
docker compose up -d db
```

Or use a local PostgreSQL database named `dealstoker` (user/password `dealstoker`).

### 2) API

```bash
cd apps/api
./gradlew bootRun
```

API: `http://localhost:8080`  
Health: `GET /api/v1/health`  
Admin basic auth defaults: `admin` / `changeme`

### 3) Web

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

Site: `http://localhost:3000`  
Admin: `http://localhost:3000/admin/login`

## Phase 1 scope

- Category + product catalog (seeded with 3 categories / 12 products)
- Public SSR pages with metadata + JSON-LD
- `/go/{slug}` affiliate redirect + click logging (`AMAZON_PARTNER_TAG` optional)
- robots.txt / sitemap.xml
- About / Disclosure / Privacy / Contact
- Admin CRUD + publish/unpublish

Associates re-application and PA-API auto-ingest are **Phase 1.5 / Phase 2**.

## Configuration

See `.env.example`. Important knobs:

| Variable | Purpose |
|----------|---------|
| `APP_BASE_URL` | Canonical site URL for sitemap/robots |
| `AMAZON_PARTNER_TAG` | Associates tag (empty until approved) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin basic auth |
| `API_BASE_URL` | Next.js → API base (web) |

## Deploy (Railway)

Domain/DNS stays on **Spaceship**. App hosting is **Railway** (web + API + Postgres).

Step-by-step: [docs/deploy/railway.md](./docs/deploy/railway.md)

Service roots:

- API → `apps/api` (Dockerfile)
- Web → `apps/web` (Dockerfile, Next standalone)
- Database → Railway Postgres plugin

## Documentation

- [Business Analysis Pack](./docs/business-analysis/README.md)
- [Associates re-application checklist](./docs/associates/reapplication-checklist.md)
- [Confirmed Decisions](./docs/business-analysis/03-confirmed-decisions.md)
- [ADR-001 SSR](./docs/adr/ADR-001-ssr-nextjs.md)
- [Railway deploy](./docs/deploy/railway.md)
