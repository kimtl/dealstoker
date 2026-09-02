# DealStoker — Confirmed Decisions Log

| Item | Value |
|------|-------|
| Updated | 2026-08-06 |
| Source | Stakeholder clarification |

## Locked decisions

| ID | Topic | Decision |
|----|-------|----------|
| D-001 | Brand / site name | **DealStoker** |
| D-002 | Primary domain | **dealstoker.com** (`https://dealstoker.com`) |
| D-003 | Target market | **United States** |
| D-004 | Language / locale | **en-US** |
| D-005 | Currency | **USD** |
| D-006 | Amazon marketplace | **Amazon.com** |
| D-007 | Amazon Associates | 과거 승인 → **현재 자격 상실** → 사이트 재구축 후 **US Associates 재신청** |
| D-008 | PA-API / auto ingest | Associates 재승인 및 API 자격 확보 **이후** Phase 2에서 가동 |

## Delivery implication

```text
Build DealStoker on dealstoker.com (US content)   ✅ Phase 1 live
        → Apply Amazon Associates US again         ← current step
        → Activate partner tag on product links
        → Enable PA-API ingestion jobs
```

Until Associates is restored:

- Ship SEO-ready catalog with manual product entry  
- Keep `partnerTag` configurable and nullable  
- Do not block Phase 1 on PA-API access  

Ops checklist: [`docs/associates/reapplication-checklist.md`](../associates/reapplication-checklist.md)

## Pending decisions

See `01-requirements-analysis.md` §11.3 and `02-implementation-plan.md` §11 (ADR-001~004, 006).
