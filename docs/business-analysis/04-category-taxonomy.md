# DealStoker US category taxonomy

Target: top-level Amazon.com deal categories for DealStoker.
Existing 3 kept and polished; 7 added via Flyway `V5__expand_category_taxonomy.sql`.

| # | Name | Slug | Sort | Notes |
|---|------|------|------|-------|
| 1 | Home & Kitchen | `home-kitchen` | 10 | Existing |
| 2 | Electronics | `electronics` | 20 | Existing |
| 3 | Outdoor & Sports | `outdoor-sports` | 30 | Existing |
| 4 | Beauty & Personal Care | `beauty-personal-care` | 40 | New |
| 5 | Health & Household | `health-household` | 50 | New |
| 6 | Baby | `baby` | 60 | New |
| 7 | Pets | `pets` | 70 | New |
| 8 | Office & School | `office-school` | 80 | New |
| 9 | Tools & Home Improvement | `tools-home-improvement` | 90 | New |
| 10 | Fashion & Accessories | `fashion-accessories` | 100 | New (optional focus) |

## Copy used in seed

### Home & Kitchen
- **Description:** Practical home and kitchen picks for cooking, cleaning, storage, and everyday living.
- **SEO title:** Best Home & Kitchen Deals on Amazon (2026) | DealStoker
- **SEO description:** Curated Home & Kitchen deals on Amazon.com — air fryers, storage, cookware, and everyday essentials with clear prices.

### Electronics
- **Description:** Everyday consumer electronics with strong ratings — audio, charging, and smart gadgets worth a look.
- **SEO title:** Best Electronics Deals on Amazon (2026) | DealStoker
- **SEO description:** Shop curated electronics deals on Amazon.com — headphones, chargers, tablet accessories, and popular gadgets.

### Outdoor & Sports
- **Description:** Workout, camping, and weekend adventure gear without overpaying.
- **SEO title:** Best Outdoor & Sports Deals on Amazon (2026) | DealStoker
- **SEO description:** Discover outdoor and sports essentials for Amazon.com shoppers — fitness, camping, and travel-ready gear.

### Beauty & Personal Care
- **Description:** Skincare, haircare, grooming, and everyday personal care picks with strong shopper ratings.
- **SEO title:** Best Beauty & Personal Care Deals on Amazon | DealStoker
- **SEO description:** Curated beauty and personal care deals on Amazon.com — skincare, hair tools, grooming, and daily essentials.

### Health & Household
- **Description:** Household staples and health essentials for the medicine cabinet, laundry room, and pantry.
- **SEO title:** Best Health & Household Deals on Amazon | DealStoker
- **SEO description:** Find health and household deals on Amazon.com — vitamins, cleaning, paper goods, and everyday staples.

### Baby
- **Description:** Practical baby and toddler essentials for feeding, sleep, travel, and daily care.
- **SEO title:** Best Baby Product Deals on Amazon | DealStoker
- **SEO description:** Curated baby deals on Amazon.com — feeding, diapers-adjacent essentials, travel gear, and parent favorites.

### Pets
- **Description:** Dog and cat essentials — food accessories, grooming, toys, and travel gear pet owners actually use.
- **SEO title:** Best Pet Product Deals on Amazon | DealStoker
- **SEO description:** Shop curated pet deals on Amazon.com for dogs and cats — bowls, toys, grooming, and everyday pet must-haves.

### Office & School
- **Description:** Desk setup, stationery, backpacks, and school or WFH tools that stay useful year-round.
- **SEO title:** Best Office & School Deals on Amazon | DealStoker
- **SEO description:** Curated office and school deals on Amazon.com — desk accessories, stationery, backpacks, and WFH essentials.

### Tools & Home Improvement
- **Description:** DIY and home-fix gear — hand tools, organizers, smart home basics, and repair essentials.
- **SEO title:** Best Tools & Home Improvement Deals on Amazon | DealStoker
- **SEO description:** Browse tools and home improvement deals on Amazon.com — DIY gear, organizers, and practical upgrade picks.

### Fashion & Accessories
- **Description:** Wearable accessories and everyday style picks — bags, watches, and simple wardrobe add-ons.
- **SEO title:** Best Fashion & Accessories Deals on Amazon | DealStoker
- **SEO description:** Curated fashion and accessories deals on Amazon.com — bags, watches, and everyday style essentials.

## After deploy

1. Redeploy **API** so Flyway V5 runs.
2. Confirm `GET /api/v1/categories` returns 10 active categories.
3. Import a few products into each new category (aim for 5+ before pushing SEO hard).
4. Add child categories later only when a niche has enough SKUs (e.g. Headphones under Electronics).
