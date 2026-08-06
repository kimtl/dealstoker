# DealStoker — Affiliate Marketing Platform  
## Business Requirements Analysis (BA)

| Item | Value |
|------|-------|
| Project | DealStoker |
| Brand / Site Name | DealStoker |
| Primary Domain | [dealstoker.com](https://dealstoker.com) |
| Target Market | United States (en-US) |
| Primary Marketplace | Amazon.com |
| Document Type | Business Requirements Analysis |
| Stack Target | Spring Boot (API/Jobs) + React (Web) |
| Version | 1.1 |
| Status | Draft — market/brand decisions locked |

---

## 0. Confirmed Business Decisions

| Decision | Value | Notes |
|----------|-------|-------|
| Brand name | **DealStoker** | 공개 UI, title 템플릿, OG site_name에 사용 |
| Domain | **dealstoker.com** | canonical base URL: `https://dealstoker.com` |
| Target market | **United States** | 언어 `en-US`, 통화 `USD` |
| Amazon marketplace | **Amazon.com** | PA-API host/region/marketplace 모두 US 기준 |
| Amazon Associates | **재신청 예정** | 과거 승인 이력 있음, 현재 자격 상실. 사이트 재구축 후 재신청 |
| PA-API | Associates 재승인 이후 | 자격 회복 전엔 자동 수집 Job은 비활성/스텁 |

**Associates 재승인 전략 (비즈니스)**  
1. Phase 1으로 실제 콘텐츠가 있는 미국향 사이트를 `dealstoker.com`에 공개  
2. Disclosure / Privacy / Contact 등 정책 페이지 완비  
3. Amazon Associates(US) 재신청 — 사이트 URL로 DealStoker 제출  
4. 승인·트래킹 태그 확보 후 어필리에이트 링크 활성화  
5. PA-API 자격/키 발급 후 Phase 2 자동 수집 가동  

자격 회복 전까지는 **수동 ASIN 등록 + (태그 없는) Amazon 상품 URL 또는 태그 플레이스홀더**로 콘텐츠/SEO를 먼저 쌓는다. 수익 링크는 태그 발급 후 일괄 치환 가능해야 한다.

---

## 1. Executive Summary

DealStoker(`dealstoker.com`)는 **미국(Amazon.com) 대상 카테고리 기반 어필리에이트 상품 큐레이션 사이트**이다. Amazon에서 “핫한” 상품을 어필리에이트 링크로 등록하고, SEO를 통해 검색 유입을 확보한 뒤 클릭/전환으로 수익을 창출한다. Associates 자격이 현재 없으므로, **사이트 재구축 → Associates 재승인 → PA-API 자동 수집** 순으로 진행한다.

### 1.1 Business Goals

| Goal ID | Goal | Success Signal |
|---------|------|----------------|
| BG-01 | 유기적(검색) 트래픽 확보 | 3개월 내 Organic Sessions 성장, 인덱싱 페이지 수 증가 |
| BG-02 | 어필리에이트 수익 창출 | Outbound Click → 추정 전환/매출 추적 |
| BG-03 | 콘텐츠·상품 운영 효율화 | 자동 Job으로 신규/갱신 상품 비율 ≥ 목표치 |
| BG-04 | SEO 확장 가능한 정보 구조 | 카테고리·상품·랜딩 URL이 검색엔진 친화적으로 유지 |

### 1.2 Non-Goals (Out of Scope for MVP)

- 자체 결제/주문/배송 (커머스 풀필먼트)
- 사용자 커뮤니티/리뷰 UGC (MVP 이후 검토)
- 다국어/다국가 완전 현지화 (Phase 2+)
- 실시간 가격 비교 엔진 (주기적 동기화로 대체)
- 광고 네트워크(AdSense 등) 수익화 (후순위)

---

## 2. Problem & Opportunity

### 2.1 Problem Statement

어필리에이트 사이트는 (1) 상품/콘텐츠를 빠르게 채우고, (2) 검색엔진에 노출되며, (3) 클릭 가능한 트래킹 링크를 안정적으로 유지해야 한다. 수동 운영만으로는 스케일이 어렵고, API/약관/SEO 품질을 동시에 관리하지 않으면 트래픽·수익이 불안정하다.

### 2.2 Opportunity

- 카테고리별 “핫 딜/베스트” 의도를 가진 검색 쿼리 대응
- PA-API(또는 허용된 데이터 소스) + 스케줄 Job으로 상품 파이프라인 자동화
- SEO 메타·구조화 데이터·내부링크로 장기 자산형 트래픽 구축

---

## 3. Stakeholders & Personas

### 3.1 Stakeholders

| Role | Interest |
|------|----------|
| Business Owner | 수익, 트래픽, 브랜드, 약관 리스크 |
| Content/SEO Operator | 카테고리·상품·콘텐츠 품질, 인덱싱 |
| Engineer | API, Job, 데이터 모델, 배포 |
| Compliance | Amazon Associates / PA-API 약관 준수 |

### 3.2 Personas

1. **검색 유입 방문자 (Buyer Intent)**  
   - “카테고리 + 베스트/추천/리뷰” 검색 → 상품 상세 → Amazon으로 이동  
2. **운영자 (Admin)**  
   - 카테고리/상품 CRUD, Job 모니터링, SEO 메타 편집, 중복/품질 검수  
3. **시스템 (Automation)**  
   - 주기적으로 검색/베스트셀러 조회 → 정규화 → 등록/갱신 → 실패 알림

---

## 4. Business Process Overview

```text
[소스: Amazon PA-API / Manual]
            │
            ▼
   Collect / Enrich / Normalize
            │
            ▼
   Deduplicate & Quality Gate
            │
            ▼
   Persist Product + Affiliate URL
            │
            ▼
   Publish (Draft → Published)
            │
            ▼
   SEO Indexing (SSR/SSG + sitemap + schema)
            │
            ▼
   User Browse → Click Out → Attribution
```

### 4.1 Core Flows

| Flow | Description |
|------|-------------|
| F-01 Manual Publish | Admin이 상품을 검색/붙여넣기 → 메타 작성 → 발행 |
| F-02 Auto Ingest | Job이 카테고리별 키워드/BrowseNode로 상품 수집 → Draft/Auto-publish |
| F-03 Refresh | 가격/가용성/이미지/순위 주기 갱신 |
| F-04 SEO Serve | 카테고리/상품/콘텐츠 페이지를 SEO 친화적으로 렌더링 |
| F-05 Click Track | 아웃바운드 클릭 로깅 후 어필리에이트 URL로 리다이렉트 |

---

## 5. Functional Requirements

### 5.1 Category Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CAT-01 | 계층형 카테고리(최대 2~3 depth) CRUD | Must |
| FR-CAT-02 | 카테고리별 slug, title, meta description, H1, canonical | Must |
| FR-CAT-03 | 카테고리별 수집 설정(키워드, BrowseNode, 마켓플레이스, locale) | Must |
| FR-CAT-04 | 카테고리 노출 순서, 활성/비활성 | Must |
| FR-CAT-05 | 카테고리 랜딩: 상품 리스트 + 소개 카피 + 내부링크 | Must |
| FR-CAT-06 | 카테고리별 FAQ / 가이드 콘텐츠 연결 (SEO) | Should |

### 5.2 Product Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PRD-01 | 상품 등록 필드: 제목, slug, 설명, 이미지, 가격, 통화, 평점, 리뷰수, ASIN/외부ID, 소스, 어필리에이트 URL, 상태 | Must |
| FR-PRD-02 | 상품–카테고리 N:M 또는 주 카테고리 1 + 보조 카테고리 | Must |
| FR-PRD-03 | 상태: `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `OUTDATED`, `BLOCKED` | Must |
| FR-PRD-04 | 동일 소스+외부ID 중복 방지 | Must |
| FR-PRD-05 | Admin 수동 등록/수정/발행/숨김 | Must |
| FR-PRD-06 | 자동 생성 SEO 텍스트 템플릿(제목/설명) + 수동 오버라이드 | Should |
| FR-PRD-07 | 상품 상세: 스펙 요약, Pros/Cons(선택), CTA(“Amazon에서 보기”) | Must |
| FR-PRD-08 | 관련 상품 / 같은 카테고리 추천 | Should |
| FR-PRD-09 | 가격 이력 저장(간단 시계열) | Could |
| FR-PRD-10 | 이미지 핫링크 vs 캐시 정책 설정 | Must (정책 결정) |

### 5.3 Affiliate Link & Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AFF-01 | Amazon Associates 태그 포함 URL 생성/저장 | Must |
| FR-AFF-02 | 클릭 트래킹 엔드포인트 (`/go/{productSlug}` 또는 `/out/{id}`) | Must |
| FR-AFF-03 | 클릭 로그: productId, categoryId, referrer, UA, IP hash, UTM, timestamp | Must |
| FR-AFF-04 | 파트너별 어필리에이트 설정(향후 확장: 쿠팡/기타) | Should |
| FR-AFF-05 | 공개 페이지에는 직접 어필리에이트 URL 노출 최소화(리다이렉트 권장) | Should |
| FR-AFF-06 | FTC/표시 고지(“어필리에이트 링크 포함”) | Must |

### 5.4 Content & SEO

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SEO-01 | 페이지별 title / meta description / canonical / robots | Must |
| FR-SEO-02 | Open Graph / Twitter Card | Must |
| FR-SEO-03 | JSON-LD: `Product`, `BreadcrumbList`, `FAQPage`(해당 시), `Organization` | Must |
| FR-SEO-04 | XML Sitemap 자동 생성(카테고리/상품/정적 페이지) + lastmod | Must |
| FR-SEO-05 | robots.txt | Must |
| FR-SEO-06 | SEO 친화 URL: `/category/{slug}`, `/product/{slug}` | Must |
| FR-SEO-07 | SSR 또는 SSG/프리렌더로 크롤러에 HTML 제공 (CSR-only 금지) | Must |
| FR-SEO-08 | 내부링크 전략: 카테고리 ↔ 상품 ↔ 가이드 | Must |
| FR-SEO-09 | 404/410 처리, 슬러그 변경 시 301 | Should |
| FR-SEO-10 | Core Web Vitals 목표( LCP/INP/CLS ) 모니터링 계획 | Should |
| FR-SEO-11 | 카테고리/상품별 고유 카피(중복 콘텐츠 방지 규칙) | Must |
| FR-SEO-12 | hreflang (다국가 시 Phase 2) | Could |

### 5.5 Automated Ingestion Job

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-JOB-01 | 스케줄 기반 Job (cron): 카테고리별 수집 | Must |
| FR-JOB-02 | 소스 어댑터: Amazon Product Advertising API 우선 | Must |
| FR-JOB-03 | 수집 모드: 키워드 검색 / BrowseNode / ASIN 리스트 | Must |
| FR-JOB-04 | Rate limit / 재시도 / 서킷브레이커 | Must |
| FR-JOB-05 | Upsert: 신규 생성 또는 가격/이미지/가용성 갱신 | Must |
| FR-JOB-06 | Quality Gate: 이미지 없음, 제목 너무 짧음, 가격 없음, 성인/금지 키워드 → 제외 | Must |
| FR-JOB-07 | 발행 정책: Auto-publish 또는 Draft 대기(카테고리 설정) | Must |
| FR-JOB-08 | Job Run 이력: 시작/종료, 성공/실패 건수, 에러 샘플 | Must |
| FR-JOB-09 | 운영 알림: 실패율 임계치 초과 시 이메일/슬랙(선택) | Should |
| FR-JOB-10 | 수동 Trigger (Admin “지금 수집”) | Should |
| FR-JOB-11 | Idempotency & 중복 수집 방지 | Must |
| FR-JOB-12 | 약관 준수: 캐시 TTL, 필수 어트리뷰션, 금지 데이터 사용 금지 | Must |

### 5.6 Admin Console

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-01 | 로그인/권한(최소 Admin role) | Must |
| FR-ADM-02 | 카테고리/상품/Job 설정 UI | Must |
| FR-ADM-03 | 상품 일괄 발행/숨김 | Should |
| FR-ADM-04 | 클릭/상위 상품 간단 대시보드 | Should |
| FR-ADM-05 | SEO 미리보기(title/description 길이) | Could |

### 5.7 Public Website

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WEB-01 | 홈: 주요 카테고리 + 추천/핫 상품 | Must |
| FR-WEB-02 | 카테고리 리스트/필터(정렬: 인기, 가격, 최신) | Must |
| FR-WEB-03 | 상품 상세 + CTA | Must |
| FR-WEB-04 | 검색(사이트 내) | Should |
| FR-WEB-05 | 정적 페이지: About, Disclosure, Privacy, Contact | Must |
| FR-WEB-06 | 모바일 반응형 | Must |
| FR-WEB-07 | 성능: 이미지 lazy-load, 캐시 헤더 | Must |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | 상품 상세 TTFB/SSR p95 목표 정의(예: < 800ms 내부망 기준); CDN 활용 |
| NFR-02 | Scalability | 상품 10만 건, 카테고리 수백 개 가정 가능한 스키마/인덱스 |
| NFR-03 | Availability | 공개 사이트와 Job/Admin 분리 배포 가능 |
| NFR-04 | Security | Admin JWT/Session, Secrets 관리, 입력 검증, SSRF 방지(아웃링크) |
| NFR-05 | Compliance | Amazon Associates Operating Agreement, PA-API License 준수 |
| NFR-06 | Observability | 구조화 로그, Job metrics, 클릭 집계, 에러 트래킹 |
| NFR-07 | Privacy | IP 해시/단기 보관, 쿠키 고지(해당 시) |
| NFR-08 | Maintainability | 소스 어댑터 패턴으로 Amazon 외 확장 |
| NFR-09 | i18n Ready | locale/marketplace 필드 설계(초기 단일 마켓) |

---

## 7. Domain Model (Logical)

### 7.1 Core Entities

```text
Category
  - id, parentId, name, slug, description, seoTitle, seoDescription
  - sortOrder, isActive
  - ingestConfig (keywords[], browseNodeId, marketplace, autoPublish, scheduleCron)

Product
  - id, source, externalId(ASIN), title, slug, description
  - imageUrl, additionalImages[]
  - priceAmount, currency, listPrice, availability
  - rating, reviewCount
  - affiliateUrl, detailPageUrl
  - status, publishedAt, lastSyncedAt
  - seoTitle, seoDescription (nullable override)
  - brand, features[]

ProductCategory
  - productId, categoryId, isPrimary

AffiliatePartner
  - id, code(AMAZON), trackingTag, marketplace, configJson

ClickEvent
  - id, productId, categoryId, occurredAt, referrer, utm*, userAgent, ipHash, sessionId

JobDefinition / JobRun / JobRunItem
  - schedule, lastRun, status, stats, errors

ContentPage (optional)
  - slug, body(markdown/html), seo fields, linkedCategoryId
```

### 7.2 Key Business Rules

1. **Unique Key**: `(source, externalId, marketplace)` 유일  
2. **Slug**: 공개 URL용, 충돌 시 suffix; 변경 시 301 맵 유지  
3. **Publish Gate**: 필수 필드(title, image, affiliateUrl, category) 충족 시에만 PUBLISHED  
4. **Stale Data**: `lastSyncedAt`이 TTL 초과 시 UI에 “가격 변동 가능” 표시 또는 재수집 우선순위  
5. **Disclosure**: 상품/사이트 공통 고지 문구 필수 노출

---

## 8. External Integrations

### 8.1 Amazon (US)

| Item | Decision |
|------|----------|
| Program | Amazon Associates **US** (재신청) |
| Store | Amazon.com |
| Locale / Currency | en-US / USD |
| Data API | Product Advertising API 5.0 (Associates 승인 후) |
| Auth | Access Key / Secret / Partner Tag (발급 후 설정) |
| Site registration URL | `https://dealstoker.com` |
| Operations | SearchItems, GetItems, GetBrowseNodes 등 |
| Constraints | Throttle, 캐시 정책, 어트리뷰션, 크리에이티브 가이드 |

**자격 공백 기간 운영 모드 (현재 적용)**  
- 수동 ASIN 등록 + Amazon.com 상품 URL 저장  
- `partnerTag`는 설정 가능하되, 미설정 시 비태그 링크 또는 CTA 비활성 정책 중 택1 (권장: 링크는 유지, 수익 태그 없이 출시 후 일괄 업데이트)  
- 자동 수집 Job은 어댑터 스켈레톤만 두고 **실호출 비활성**  
- Associates 승인 체크리스트용 최소 콘텐츠 볼륨(카테고리·상품·정책 페이지)을 Phase 1 exit criteria에 포함

### 8.2 Optional Later

- Google Search Console / Indexing API  
- Analytics (GA4)  
- Slack/Email webhook  
- Object storage (이미지 캐시)

---

## 9. SEO Strategy Requirements (Business View)

### 9.1 Page Types & Intent

| Page | Search Intent | Content Obligation |
|------|---------------|--------------------|
| Home | Brand / 발견 | 카테고리 허브, 최신 핫 딜 |
| Category | Commercial investigation | 고유 인트로 + 큐레이션 리스트 + FAQ |
| Product | Transactional | 요약, 주요 특징, CTA, 관련 상품 |
| Guide/Listicle | Informational→Commercial | “Top 10 …” 편집 콘텐츠 (Phase 1.5) |

### 9.2 SEO Acceptance Criteria

- 모든 공개 페이지가 뷰소스에서 의미 있는 title/h1/본문 확인 가능  
- Product JSON-LD에 name, image, offers(price/currency/availability) 포함  
- Sitemap이 발행 상품만 포함, noindex 페이지 제외  
- Thin content(제목+링크만) 비율을 낮추기 위한 최소 본문 길이/템플릿 규칙  
- 중복 ASIN/유사 페이지 통합 또는 canonical 정책

---

## 10. Analytics & KPIs

| KPI | Definition |
|-----|------------|
| Organic Sessions | 검색 유입 세션 |
| Indexed Pages | GSC 기준 유효 페이지 |
| CTR (SERP) | 검색 노출 대비 클릭 |
| Outbound CTR | 상품 상세 → 외부 클릭 비율 |
| Revenue (reported) | Associates 리포트 매출/커미션 |
| Job Success Rate | 성공 수집 / 시도 |
| Time-to-Publish | 수집 → 공개까지 소요 |
| Content Freshness | 평균 lastSyncedAt 연령 |

---

## 11. Assumptions & Open Questions

### 11.1 Assumptions (updated)

- 타깃은 **미국 단일 마켓** (Amazon.com, en-US, USD)  
- 브랜드/도메인: **DealStoker / dealstoker.com**  
- MVP는 Amazon 단일 파트너  
- Associates는 재신청으로 회복 가능하다고 가정; 승인 전에도 사이트·SEO 구축은 진행  
- 자동 발행은 카테고리별로 on/off (기본 Draft 권장)  
- 법무/세무는 사업자 책임 영역(시스템 고지 문구만 제공)

### 11.2 Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | 타깃 국가/마켓/언어 | **US / Amazon.com / en-US** |
| 2 | Associates / PA-API 자격 | **현재 상실 → 사이트 재구축 후 재신청**. PA-API는 승인 후 |
| — | 사이트명 / 도메인 | **DealStoker / dealstoker.com** |

### 11.3 Still Open

3. 자동 발행 vs Draft 검수 기본값? (권장: Draft)  
4. 이미지 핫링크 허용 vs 자체 캐시? (권장: MVP 핫링크)  
5. SSR 방식: Next.js vs Spring SSR? (권장: Next.js)  
6. Admin을 같은 웹 앱에 둘지, 별도 분리할지?  
7. 사용자 계정(위시리스트 등) 필요 여부? (권장 MVP: 불필요)  
8. “핫”의 정의: 베스트셀러 / 할인율 / 클릭 / 수동 핀?  
9. Associates 승인 전 CTA 정책: 비태그 Amazon 링크 허용 vs 승인 전 CTA 숨김?

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Associates 재승인 지연/거절 | 수익·PA-API 지연 | Phase 1을 승인용 완성도로 구축; 태그 설정 분리; 거절 사유 대응 체크리스트 |
| PA-API 자격/제한 | 자동수집 불가 | 수동 등록 MVP 먼저, 승인 후 Phase 2 |
| 약관 위반(금지 클레임, 가격 오표기) | 계정 정지 | 고지, 캐시 TTL, 과장 표현 금지, 검수 게이트 |
| Thin/Duplicate SEO | 트래픽 실패 | 카테고리 카피, 가이드 콘텐츠, canonical |
| API Throttle | Job 실패 | 큐잉, 백오프, 우선순위 갱신 |
| Link rot / 품절 | UX·수익 저하 | 가용성 동기화, OUTDATED 처리 |
| 상표/저작권 이슈 | 법적 리스크 | 공식 이미지·문구 가이드 준수 |

---

## 13. MVP Scope Recommendation

### In MVP

- `dealstoker.com` 미국향 공개 사이트 (브랜드 DealStoker)  
- 카테고리 CRUD + 공개 카테고리/상품 페이지  
- 상품 수동 등록 + Amazon.com URL / (승인 후) 어필리에이트 태그 주입  
- 클릭 트래킹 리다이렉트  
- SEO 기본(meta, sitemap, robots, JSON-LD)  
- SSR/프리렌더 기반 공개 웹  
- Associates 재신청에 필요한 정책 페이지·콘텐츠 볼륨  
- Admin 기본 화면  
- Amazon 수집 Job은 **코드/설정 준비**, 실연동은 Associates·PA-API 승인 후  

### MVP 직후 (자격 회복 시)

- Partner tag 일괄 적용  
- Amazon 수집 Job 1종(키워드 또는 BrowseNode) + Draft 적재 가동  

### Post-MVP

- 에디토리얼 Top-N 가이드  
- 다파트너 어필리에이트  
- 고도화 대시보드 / A-B CTA  
- 검색/추천 고도화  
- 다국가·다국어  

---

## 14. Requirement Traceability (Summary)

| Business Goal | Primary Requirements |
|---------------|----------------------|
| BG-01 Traffic | FR-SEO-*, FR-WEB-*, FR-CAT-05/06 |
| BG-02 Revenue | FR-AFF-*, FR-PRD-07, FR-WEB-03 |
| BG-03 Automation | FR-JOB-*, FR-CAT-03 |
| BG-04 IA/SEO Scale | FR-CAT-02, FR-PRD-01/04, FR-SEO-06/08 |
