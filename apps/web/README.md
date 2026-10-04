# DealStoker Web

Next.js (App Router) public site + admin UI for [dealstoker.com](https://www.dealstoker.com).
See the repository root `README.md` for the full stack and `docs/deploy/railway.md` for deployment.

## Local development

```bash
cp .env.local.example .env.local   # API_BASE_URL, NEXT_PUBLIC_SITE_URL
npm install
npm run dev
```

The site expects the Spring Boot API from `apps/api` on `API_BASE_URL` (default `http://localhost:8080`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run test:unit` | Node test runner over `src/**/*.test.mts` |

## Layout

- `src/app/(site)` — public pages (home, category, product, search, guides, policies)
- `src/app/(site)/guides` — editorial buying guides (`/guides`, `/guides/[slug]`, Markdown body via `components/MarkdownBody`)
- `src/app/admin` — admin UI (Basic auth against the API via `/api/backend`); `/admin/guides` edits guides
- `src/app/api/backend/[...path]` — runtime proxy to `API_BASE_URL/api/v1/*`
- `src/app/go/[slug]` — affiliate redirect proxy (click logging happens in the API)
- `src/proxy.ts` — apex→www redirect and locale detection (`?hl=`, cookie, Accept-Language)
- `src/lib/i18n` — en/ko messages and locale helpers
