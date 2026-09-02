# Amazon Associates US — Re-application Pack (DealStoker)

| Item | Value |
|------|-------|
| Site | https://dealstoker.com |
| Brand | DealStoker |
| Marketplace | Amazon.com (US) / en-US / USD |
| Status | Phase 1 live → **submit US Associates re-application** |
| Partner tag (prod) | Keep `AMAZON_PARTNER_TAG` **empty** until approval |
| Updated | 2026-09-02 |

> This pack prepares and documents the re-application. **Only the account owner can submit** in [Amazon Associates Central](https://affiliate-program.amazon.com/). This repo cannot log into Amazon on your behalf.

---

## 1. Live readiness audit (verified 2026-09-02)

| Requirement | DealStoker status | Evidence |
|-------------|-------------------|----------|
| Public live site | Pass | `https://dealstoker.com` → 200 |
| Original / curated catalog | Pass (MVP) | 3 active categories, **12** published products |
| Policy: Affiliate Disclosure | Pass | `/disclosure` → 200 |
| Policy: Privacy | Pass | `/privacy` → 200 (not directed to children under 13) |
| Policy: Contact | Pass | `/contact` → 200 (`hello@dealstoker.com`) |
| About / editorial intent | Pass | `/about` → 200 |
| Footer + CTA disclosure | Pass | Short Associates disclosure site-wide |
| Sitemap / robots | Pass | `/sitemap.xml`, `/robots.txt` |
| Outbound Amazon links | Pass | `/go/{slug}` → 302 to `amazon.com` product URL |
| Partner tag before approval | Correct | Tag omitted until `AMAZON_PARTNER_TAG` is set |
| Not a kids site | Pass | Privacy states not directed to under-13 |

### Catalog snapshot (API)

- Active categories: **3** (Home & Kitchen, Electronics, Outdoor & Sports)
- Published products: **12**
- Featured deals + Top buys + Latest feed on homepage

### Gaps to improve (optional before / during review)

- Add more **original editorial** (category intros, short buying notes) — Amazon prefers substance over thin link lists.
- Keep products/content **updated** (recent publishes/edits within ~60 days helps).
- Confirm `hello@dealstoker.com` / `privacy@dealstoker.com` actually receive mail (Spaceship DNS/MX).

---

## 2. Application — what to enter

Sign up / re-apply: https://affiliate-program.amazon.com/

### Website

| Field | Suggested value |
|-------|-----------------|
| Primary website | `https://dealstoker.com` |
| Additional URLs (optional) | `https://www.dealstoker.com` (if www redirects to apex, still list apex as primary) |

### How you describe the site (draft)

> DealStoker is a US-focused Amazon.com deal curation site. We publish category pages and product pages for home, electronics, and outdoor gear, with clear prices, ratings context, and affiliate disclosure. Shoppers browse curated lists and click through to Amazon.com product pages.

### How you drive traffic (draft)

> Organic search (SEO), direct visits, and category/product landing pages on dealstoker.com. No paid incentive clicks; no cookie stuffing.

### Topics / niche

> Consumer product deals and curated shopping guides for US Amazon.com shoppers (home & kitchen, electronics, outdoor & sports).

### Children under 13?

> **No**

### Mobile app / social only?

> Website primary. List social profiles only if they are public, established, and will carry Associates links.

---

## 3. Owner action checklist (submit day)

Do these in order:

1. [ ] Confirm apex + www resolve and show the same branded site.
2. [ ] Spot-check `/`, `/about`, `/disclosure`, `/privacy`, `/contact`, one `/c/*`, one `/p/*`.
3. [ ] Confirm footer shows: *As an Amazon Associate I earn from qualifying purchases.*
4. [ ] Confirm product CTA shows disclosure near “View on Amazon”.
5. [ ] Open Associates Central → apply / re-apply for **Amazon.com (US)**.
6. [ ] Enter `https://dealstoker.com` exactly; use the description drafts above.
7. [ ] Complete tax / payment profile when prompted (W-9 for US persons/entities as applicable).
8. [ ] Save confirmation / application ID in your ops notes.
9. [ ] **Do not** set `AMAZON_PARTNER_TAG` on Railway until approved.
10. [ ] After approval → follow §4 Activation.

### While pending

- Keep publishing/updating real product pages (avoid an empty or stale site).
- Do not promise “Amazon endorsed” or misuse Amazon trademarks.
- Do not place Associates tags from another account or use incented/misleading placements.

---

## 4. Post-approval activation (Phase 1.5)

When Associates Central shows an approved **Store ID / tracking ID** (tag like `yourtag-20`):

### Railway (API service)

1. Set `AMAZON_PARTNER_TAG=<your-approved-tag>`
2. Confirm `AMAZON_MARKETPLACE=www.amazon.com`
3. Redeploy / restart API so config reloads
4. Verify:

```bash
curl -sI "https://dealstoker.com/go/<published-slug>"
# Expect Location: https://www.amazon.com/... containing tag=<your-tag>
```

5. Click once from a real browser → confirm click appears in Associates reports (may lag).
6. Optionally enable PA-API keys later → **Phase 2 ingestion** (separate work).

### Rollback

Unset / blank `AMAZON_PARTNER_TAG` and restart API; `/go` still redirects to Amazon without earning attribution.

---

## 5. Rejection / delay playbook

| Signal | Response |
|--------|----------|
| Thin content | Add category intros, unique product notes, keep ≥10 substantive pages updated |
| Missing disclosure | Ensure `/disclosure` + footer + CTA short disclosure |
| Wrong URL / login wall | Use public `https://dealstoker.com`, no auth on public pages |
| Trademark / misleading claims | Remove “official Amazon” language; keep disclosure trademark note |
| Kids-directed content | Keep adult shopping positioning; privacy already excludes under-13 |

Re-read current policies before resubmitting:  
https://affiliate-program.amazon.com/help/operating/participation/  
https://affiliate-program.amazon.com/help/operating/agreement/

---

## 6. Definition of done (Phase 1.5)

- [ ] Associates US account **approved**
- [ ] `AMAZON_PARTNER_TAG` set in production
- [ ] `/go/{slug}` Location includes `tag=`
- [ ] Associates report shows attributed clicks
- [ ] Then schedule Phase 2 (PA-API ingest) if desired
