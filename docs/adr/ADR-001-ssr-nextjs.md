# ADR-001: Public rendering with Next.js SSR

## Status
Accepted (Phase 1)

## Context
DealStoker needs SEO-friendly HTML for category and product pages on dealstoker.com.

## Decision
Use Next.js App Router (React) with server components for the public site. Spring Boot serves JSON APIs, click redirects, sitemap/robots, and admin APIs.

## Consequences
- Public pages are crawlable without relying on client-only rendering.
- Admin UI lives in the same Next.js app under `/admin`.
- Deployment has two runtime units: `apps/api` and `apps/web`.
