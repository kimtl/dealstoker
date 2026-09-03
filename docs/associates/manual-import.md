# Manual product import (no PA-API)

Until Product Advertising API credentials are available, add products from Amazon URLs in Admin.

## Flow

1. Admin → **Products → New**
2. Paste Amazon product URL (or ASIN) → **Preview & fill form** or **Import as draft**
3. Backend crawls the Amazon **product detail page** (mobile UA) for title, price, image, feature bullets, brand, rating
4. Create SiteStripe affiliate link in Associates Central
5. Paste that link into **Outbound Amazon / SiteStripe URL** and save
6. Publish when ready

## Notes

- Crawl uses Jsoup with Android/iPhone user-agents first (desktop often CAPTCHA from servers).
- `/go/{slug}` still appends `tag=dealstoker01-20` to full `amazon.com` URLs when the tag is missing.
- SiteStripe short links (`amzn.to`, `a.co`) are not rewritten.
- If Amazon blocks the crawl, ASIN + canonical URL still import; fill remaining fields manually.
- PA-API ingestion remains Phase 2 when keys are available.
