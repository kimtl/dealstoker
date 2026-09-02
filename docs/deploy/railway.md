# Deploy DealStoker on Railway

Spaceship keeps the **domain + DNS (+ email)**. Railway runs **web + API + Postgres**.

## Architecture

```text
dealstoker.com  (Spaceship DNS)
       │
       ▼
  Railway Web  (Next.js)  ──API_BASE_URL──►  Railway API  (Spring Boot)
                                                    │
                                                    ▼
                                              Railway Postgres
```

Recommended public hostnames:

| Host | Points to |
|------|-----------|
| `dealstoker.com` / `www` | Railway **web** service |
| `api.dealstoker.com` (optional) | Railway **api** service |

If you skip `api.` subdomain, use the Railway-generated API URL (`*.up.railway.app`) as `API_BASE_URL`.

## 1. Create Railway project

1. Sign up at [railway.app](https://railway.app) → **Hobby** plan is enough to start.
2. **New Project** → empty project (or deploy from GitHub `kimtl/dealstoker`).
3. Connect the GitHub repo and select branch (after merge: `main`).

## 2. Add Postgres

1. In the project: **New** → **Database** → **PostgreSQL**.
2. Keep the default plugin variables (`DATABASE_URL`, etc.).

## 3. API service

1. **New** → **GitHub Repo** (same repo) → set **Root Directory** to `apps/api`.
2. Builder: Dockerfile (`apps/api/Dockerfile` + `railway.toml`).
3. **Variables** (Settings → Variables):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Reference Postgres `${{Postgres.DATABASE_URL}}` |
| `APP_BASE_URL` | `https://dealstoker.com` |
| `CORS_ALLOWED_ORIGINS` | `https://dealstoker.com,https://www.dealstoker.com` |
| `ADMIN_USERNAME` | strong username |
| `ADMIN_PASSWORD` | strong password |
| `AMAZON_MARKETPLACE` | `www.amazon.com` |
| `AMAZON_PARTNER_TAG` | `dealstoker01-20` (Associates Store ID — API service) |

`PORT` is set by Railway automatically. The API converts Railway’s `postgresql://…` URL into a JDBC URL at startup (Docker entrypoint + DataSource config). You can also set `DATABASE_URL` to a JDBC URL yourself if preferred.

If the API fails with `'url' must start with "jdbc"`, redeploy the latest API image and confirm the Postgres service is linked (so `DATABASE_URL` is present).

4. Generate a public domain for the API (or attach `api.dealstoker.com`).
5. Health check path: `/actuator/health`.

## 4. Web service

1. **New** → same repo → **Root Directory** `apps/web`.
2. Builder: Dockerfile.
3. **Variables**:

| Variable | Value |
|----------|--------|
| `API_BASE_URL` | Public API URL, e.g. `https://api.dealstoker.com` or `https://<api>.up.railway.app` (**runtime** variable — required) |
| `NEXT_PUBLIC_SITE_URL` | `https://dealstoker.com` (**build** arg / variable) |

`/api/backend/*` and `/go/*` are **runtime proxies** (not build-time rewrites). Set `API_BASE_URL` on the Web service and redeploy; no rebuild-arg needed for the API host.

If Admin login hits `/api/backend/api/v1/admin/me` → 404/502, `API_BASE_URL` is missing or wrong on the **web** service.

4. Generate a public domain for web (or attach `dealstoker.com` / `www`).

## 5. Spaceship DNS

At Spaceship Advanced DNS:

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | Railway web domain (`xxxx.up.railway.app`) |
| CNAME or ALIAS | `@` | Railway web domain (use Railway custom domain instructions if apex ALIAS unsupported) |
| CNAME | `api` | Railway API domain (optional) |

Then in Railway → each service → **Custom Domain** → add `dealstoker.com` / `www` / `api` and wait for SSL.

## 6. Smoke checklist

- [ ] `https://dealstoker.com/` loads Featured deals / Top buys / Latest
- [ ] `https://dealstoker.com/api/backend/api/v1/health` (or API host `/actuator/health`) OK
- [ ] Product page + `/go/{slug}` redirect works
- [ ] `/sitemap.xml` and `/robots.txt` reachable on the **site** host
- [ ] Sitemap entries include product `lastmod` and image URLs when available
- [ ] Submit `https://dealstoker.com/sitemap.xml` in Google Search Console
- [ ] Admin login at `/admin/login`
- [ ] Search Console URL Inspection shows SSR HTML

## 7. Cost tips

- Start on **Hobby ($5/mo)** + usage; expect roughly **$20–50/mo** for web+api+Postgres.
- Set a **usage limit / alert** in Railway billing.
- Scale RAM for API first if Flyway/boot or traffic spikes.

## Local Docker parity (optional)

```bash
# API image
docker build -t dealstoker-api ./apps/api

# Web image
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -t dealstoker-web ./apps/web

docker run --rm -p 3000:3000 \
  -e API_BASE_URL=http://host.docker.internal:8080 \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  dealstoker-web
```
