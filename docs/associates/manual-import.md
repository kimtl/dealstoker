# Manual product import (no PA-API)

Until Product Advertising API credentials are available, add products from Amazon URLs in Admin.

## Flow

1. Admin → **Products → New**
2. Paste Amazon product URL (or ASIN) → **Preview & fill form** or **Import as draft**
3. Review title / image / price (best-effort scrape from the public product page)
4. Create SiteStripe affiliate link in Associates Central
5. Paste that link into **Outbound Amazon / SiteStripe URL** and save
6. Publish when ready

## Notes

- `/go/{slug}` still appends `tag=dealstoker01-20` to full `amazon.com` URLs when the tag is missing.
- SiteStripe short links (`amzn.to`, `a.co`) are not rewritten.
- Amazon may block server-side page fetches (CAPTCHA). ASIN + canonical URL still import; fill remaining fields manually.
- PA-API ingestion remains Phase 2 when keys are available.
