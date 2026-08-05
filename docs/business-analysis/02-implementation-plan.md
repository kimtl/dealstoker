# DealStoker — Implementation Requirements & Plan

| Item | Value |
|------|-------|
| Related Doc | `01-requirements-analysis.md` |
| Architecture | Spring Boot backend + React frontend |
| Version | 1.0 |

---

## 1. Solution Architecture

### 1.1 Recommended Topology

```text
                    ┌─────────────────────────────┐
   Users/Crawlers → │  Web (React + SSR layer)    │
                    │  - Public pages             │
                    │  - Admin SPA (auth)         │
                    └──────────────┬──────────────┘
                                   │ HTTPS/JSON
                    ┌──────────────▼──────────────┐
                    │  Spring Boot API            │
                    │  - Catalog / SEO / Tracking │
                    │  - Admin APIs               │
                    └───────┬─────────────┬───────┘
                            │             │
                   ┌────────▼───┐   ┌─────▼──────────┐
                   │ PostgreSQL │   │ Redis (optional)│
                   │            │   │ cache / locks   │
                   └────────────┘   └────────────────┘

                    ┌─────────────────────────────┐
                    │  Spring Boot Worker         │
                    │  - Scheduled ingestion jobs │
                    │  - Amazon PA-API client     │
                    └──────────────┬──────────────┘
                                   │
                            ┌──────▼──────┐
                            │ Amazon PA-API│
                            └─────────────┘
```

### 1.2 Why this split

| Concern | Choice |
|---------|--------|
| SEO HTML | React 앱이 **SSR/SSG 가능해야 함** (권장: Next.js on React). CSR-only SPA는 비권장. |
| Domain/API | Spring Boot로 카탈로그, 트래킹, Admin, Job 오케스트레이션 |
| Jobs | 동일 코드베이스의 Worker 프로필 또는 별도 배포 유닛 (`--spring.profiles.active=worker`) |
| DB | PostgreSQL (관계형 카탈로그·잡 이력에 적합) |

> **중요 결정**: “Spring Boot + React”를 SEO 사이트에 쓰려면 React는 Vite CSR이 아니라 **Next.js(또는 동등 SSR)** 를 쓰는 것을 구현 전제로 한다. Spring이 HTML을 직접 렌더하고 React는 Admin/hydration만 담당하는 대안도 가능하나, 콘텐츠 SEO 확장성 측면에서 Next.js BFF/SSR을 기본 권장한다.

### 1.3 Alternative (acceptable)

- **Spring Boot + Thymeleaf(또는 Mustache)** 로 공개 페이지 SSR  
- React는 Admin Console만  
- SEO 단순·운영 단순, 프론트 경험은 다소 전통적

본 계획은 **Option A: Next.js(Public+Admin) + Spring Boot(API+Worker)** 기준으로 작성한다.

---

## 2. Module Breakdown

### 2.1 Backend Modules (Spring Boot)

| Module | Responsibility |
|--------|----------------|
| `catalog` | Category, Product, slug, publish state |
| `affiliate` | Partner config, link builder, click redirect/logging |
| `seo` | sitemap.xml, robots.txt meta helpers, canonical rules |
| `ingestion` | Job definitions, runners, source adapters |
| `amazon` | PA-API client, DTO mapping, throttle |
| `admin` | Auth, admin-only APIs |
| `analytics` | Click aggregates, job metrics endpoints |
| `common` | Error model, pagination, auditing |

### 2.2 Frontend Apps (React/Next.js)

| Area | Routes (example) |
|------|------------------|
| Public | `/`, `/c/[categorySlug]`, `/p/[productSlug]`, `/go/[productSlug]`, `/about`, `/disclosure` |
| Admin | `/admin/login`, `/admin/categories`, `/admin/products`, `/admin/jobs`, `/admin/clicks` |

---

## 3. Detailed Implementation Requirements

### 3.1 API Contract (MVP sketch)

#### Categories
- `GET /api/v1/categories` (tree/list, public)
- `GET /api/v1/categories/{slug}` 
- `GET /api/v1/categories/{slug}/products?sort=&page=`
- Admin: `POST/PUT/PATCH/DELETE /api/v1/admin/categories`

#### Products
- `GET /api/v1/products/{slug}`
- `GET /api/v1/products?category=&q=&sort=&page=`
- Admin CRUD + publish actions

#### Tracking
- `GET /go/{productSlug}` → 302 to affiliate URL + async click log  
  (프론트 직접 링크 대신 서버 리다이렉트 권장)

#### SEO
- `GET /sitemap.xml` (또는 정적 생성 파이프라인)
- `GET /robots.txt`

#### Jobs (Admin)
- `GET /api/v1/admin/jobs`
- `POST /api/v1/admin/jobs/{id}/run`
- `GET /api/v1/admin/jobs/runs/{runId}`

### 3.2 Data Persistence Requirements

- Flyway/Liquibase 마이그레이션 필수  
- 인덱스:
  - `product(source, external_id, marketplace)` UNIQUE  
  - `product(slug)` UNIQUE  
  - `category(slug)` UNIQUE  
  - `product(status, published_at)`  
  - `click_event(occurred_at)`, `click_event(product_id, occurred_at)`  
- Soft constraints: slug immutable preferred; change table `slug_redirect`

### 3.3 Amazon Adapter Requirements

1. Config: `accessKey`, `secretKey`, `partnerTag`, `host`, `region`, `marketplace`  
2. Map PA-API item → internal `ProductDraft`  
3. Affiliate URL: Associates 딥링크/PA-API detail URL + tag  
4. Respect TPS; global rate limiter per account  
5. Store raw payload (optional, TTL/compaction) for debug  
6. Failure taxonomy: auth, throttle, not found, mapping, quality reject  

### 3.4 Job Design Requirements

```text
Cron Trigger
  → Lock category ingest (Redis/DB)
  → Resolve query (keywords / browseNode)
  → Page through results (maxItems per run)
  → For each item:
        map → validate → upsert
        apply publish policy
  → Write JobRun stats
  → Release lock
```

**Scheduling examples**
- Hot categories: every 6 hours  
- Long-tail: daily  
- Price refresh for top clicked: hourly/daily  

**Idempotency**
- Upsert by `(source, externalId, marketplace)`  
- JobRunItem unique on `(runId, externalId)`  

### 3.5 SEO Implementation Requirements

| Item | Implementation Note |
|------|---------------------|
| SSR | Product/Category pages server-rendered |
| Meta | DB fields → `<title>`, meta description |
| JSON-LD | Server component에서 주입 |
| Sitemap | 발행 엔티티 기반 생성, 청크 분할(5만 URL) |
| Canonical | 절대 URL, www/non-www 통일 |
| Performance | image `next/image` 또는 CDN, font subset |
| Disclosure | 글로벌 푸터 + 상품 CTA 근접 고지 |

### 3.6 Security & Compliance Checklist

- [ ] Secrets는 env/secret manager (코드 커밋 금지)  
- [ ] Admin 인증 + CSRF 전략(쿠키 세션 시)  
- [ ] Outbound redirect allowlist(도메인)  
- [ ] PII 최소화(IP hash)  
- [ ] Associates disclosure 문구  
- [ ] PA-API 데이터 보관 기간/재검증 주기 문서화  

---

## 4. Phased Delivery Plan

### Phase 0 — Foundations
**Outcome**: 실행 가능한 모노레포/멀티레포 골격

- 저장소 구조, CI, 로컬 docker-compose (Postgres)  
- Spring Boot app skeleton + Flyway  
- Next.js app skeleton + design tokens  
- 환경 설정 템플릿 (`.env.example`)  
- ADR: SSR 방식, 배포 단위, 마켓 선택  

**Exit criteria**: Hello API + Hello SSR page + DB up

### Phase 1 — Catalog MVP (Manual)
**Outcome**: 수동으로 카테고리/상품 올려 SEO 페이지 운영 가능

- Category/Product 스키마 + Admin API  
- Public category/product pages (SSR)  
- Affiliate redirect + click log  
- robots/sitemap/basic JSON-LD  
- Disclosure/Privacy  
- Admin UI: login, category/product CRUD, publish  

**Exit criteria**: 운영자가 상품 10개+ 카테고리 3개를 발행하고 구글 URL 검사에서 HTML 확인

### Phase 2 — Ingestion Job MVP
**Outcome**: Amazon에서 주기 수집 → Draft/Publish

- PA-API client + throttle  
- Category ingest config  
- Scheduled job + run history  
- Quality gate + upsert  
- Admin “Run now” + 실패 로그  

**Exit criteria**: 스케줄 1회 이상 성공, 중복 없이 upsert, 실패 시 이력 확인

### Phase 3 — SEO & Growth Hardening
**Outcome**: 검색 유입 확장 준비

- Category intro/FAQ 콘텐츠  
- 내부링크 블록, related products  
- Slug 301 map  
- Search Console 연동 가이드  
- Core Web Vitals 개선  
- 클릭/카테고리 대시보드  

**Exit criteria**: 인덱스 증가 추적, 상위 랜딩 페이지 템플릿 확정

### Phase 4 — Scale & Expansion
**Outcome**: 운영 자동화·파트너 확장

- 다파트너 어댑터 인터페이스  
- 가격 이력/알림  
- 에디토리얼 가이드 CMS  
- A/B CTA  
- 다마켓 locale  

---

## 5. Work Breakdown (Engineering Backlog Themes)

### Theme A — Platform
1. Repo/bootstrap  
2. Auth  
3. Observability  
4. Deploy pipelines  

### Theme B — Catalog Domain
1. Schema & migrations  
2. Category APIs/UI  
3. Product APIs/UI  
4. Publish workflow  

### Theme C — Public SEO Web
1. Layout/IA  
2. Category page  
3. Product page  
4. Sitemap/robots/JSON-LD  
5. Performance pass  

### Theme D — Affiliate Tracking
1. Link builder  
2. Redirect endpoint  
3. Click storage & daily aggregate  

### Theme E — Ingestion
1. PA-API integration  
2. Mapper/quality gates  
3. Scheduler/worker  
4. Admin monitoring  

### Theme F — Compliance/Content
1. Disclosure pages  
2. SEO copy guidelines  
3. Forbidden claims checklist  

---

## 6. Suggested Repository Layout

```text
dealstoker/
  apps/
    web/                 # Next.js (React)
    api/                 # Spring Boot API
    worker/              # optional; or api with worker profile
  packages/
    eslint-config/
  docs/
    business-analysis/
    adr/
  docker-compose.yml
  README.md
```

단일 Gradle 멀티모듈 + `web/` 도 가능.

---

## 7. Technology Choices (Opinionated Defaults)

| Layer | Default | Notes |
|-------|---------|-------|
| API | Java 21, Spring Boot 3.x | Web, Validation, Security, Data JPA |
| DB | PostgreSQL 16 | |
| Migration | Flyway | |
| Job | Spring Scheduler + ShedLock | 다중 인스턴스 안전 |
| HTTP Client | WebClient | PA-API 서명 필요 |
| Frontend | Next.js (App Router) + TypeScript | SSR/SSG |
| Styling | CSS variables + 명확한 브랜드 방향 | 제네릭 퍼플 테마 지양 |
| Auth | Session cookie or JWT for Admin | MVP는 단일 Admin |
| Cache | Redis optional | sitemap/job lock |
| Objects | S3-compatible optional | image cache later |

---

## 8. Testing Strategy

| Layer | Scope |
|-------|-------|
| Unit | mappers, quality gates, slugify, link builder |
| Integration | API + Testcontainers Postgres |
| Contract | PA-API client with recorded fixtures (VCR-like) |
| E2E | Publish product → public page → `/go` redirect |
| SEO checks | smoke: title/h1/json-ld present |
| Load (later) | category listing, redirect endpoint |

---

## 9. Deployment & Environments

| Env | Purpose |
|-----|---------|
| local | docker-compose |
| staging | PA-API sandbox/real limited, noindex 가능 |
| production | public indexable |

**Runtime config**
- `ASSOCIATES_TAG`, `PAAPI_*`, `DATABASE_URL`, `APP_BASE_URL`  
- Worker replicas = 1 or ShedLock required  

---

## 10. Acceptance Criteria by Phase (Testable)

### Phase 1
- Given published product, When crawler fetches `/p/{slug}`, Then HTML contains unique title, h1, product name, CTA  
- Given click on CTA, When `/go/{slug}` called, Then 302 to Amazon URL containing partner tag AND click_event row created  
- Sitemap contains only PUBLISHED entities  

### Phase 2
- Given category ingest config, When job runs, Then ≤ maxItems products upserted without duplicate ASIN  
- Given missing image item, Then rejected with reason in JobRunItem  
- Given autoPublish=false, Then products remain DRAFT  

### Phase 3
- Category page has editorial intro ≥ minimum length  
- Related products render  
- Slug change creates 301  

---

## 11. Decision Log (to fill)

| ADR | Question | Options | Recommendation |
|-----|----------|---------|----------------|
| ADR-001 | Public rendering | Next SSR vs Spring SSR | Next SSR |
| ADR-002 | Monorepo vs polyrepo | mono / poly | mono |
| ADR-003 | Auto-publish default | on / off | off (Draft) |
| ADR-004 | Image strategy | hotlink / cache | hotlink MVP → cache later |
| ADR-005 | Marketplace | .com / .co.kr / ... | TBD by business |
| ADR-006 | “Hot” definition | bestseller / discount / clicks | bestseller + manual pin |

---

## 12. Immediate Next Actions (BA → Build)

1. 마켓플레이스/언어/Associates 자격 확정  
2. ADR-001~006 결정  
3. Phase 0 스캐폴딩 착수  
4. 카테고리 택소노미 초안(10~30개) 작성  
5. SEO 키워드 시드 리서치(카테고리당 primary keyword)  
6. 브랜드 비주얼 방향(색/타이포/히어로 이미지 정책) 확정  
7. PA-API 자격 신청/키 발급 트랙 시작  

---

## 13. Deliverables Checklist

- [x] Business requirements analysis  
- [x] Implementation plan & architecture  
- [ ] ADR set (001+)  
- [ ] Category taxonomy spreadsheet  
- [ ] API OpenAPI draft  
- [ ] UI wireframes (home/category/product/admin)  
- [ ] Compliance copy (disclosure)  
- [ ] Phase 0 project bootstrap  
