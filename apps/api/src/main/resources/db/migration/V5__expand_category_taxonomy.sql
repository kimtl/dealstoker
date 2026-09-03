-- Expand US deal taxonomy: keep existing 3, add high-intent Amazon categories.
-- Idempotent on slug so re-runs / partial environments are safe.

UPDATE categories
SET
    description = 'Practical home and kitchen picks for cooking, cleaning, storage, and everyday living.',
    seo_title = 'Best Home & Kitchen Deals on Amazon (2026) | DealStoker',
    seo_description = 'Curated Home & Kitchen deals on Amazon.com — air fryers, storage, cookware, and everyday essentials with clear prices.',
    sort_order = 10,
    updated_at = NOW()
WHERE slug = 'home-kitchen';

UPDATE categories
SET
    description = 'Everyday consumer electronics with strong ratings — audio, charging, and smart gadgets worth a look.',
    seo_title = 'Best Electronics Deals on Amazon (2026) | DealStoker',
    seo_description = 'Shop curated electronics deals on Amazon.com — headphones, chargers, tablet accessories, and popular gadgets.',
    sort_order = 20,
    updated_at = NOW()
WHERE slug = 'electronics';

UPDATE categories
SET
    description = 'Workout, camping, and weekend adventure gear without overpaying.',
    seo_title = 'Best Outdoor & Sports Deals on Amazon (2026) | DealStoker',
    seo_description = 'Discover outdoor and sports essentials for Amazon.com shoppers — fitness, camping, and travel-ready gear.',
    sort_order = 30,
    updated_at = NOW()
WHERE slug = 'outdoor-sports';

INSERT INTO categories (name, slug, description, seo_title, seo_description, sort_order, is_active)
SELECT v.name, v.slug, v.description, v.seo_title, v.seo_description, v.sort_order, TRUE
FROM (
    VALUES
        (
            'Beauty & Personal Care',
            'beauty-personal-care',
            'Skincare, haircare, grooming, and everyday personal care picks with strong shopper ratings.',
            'Best Beauty & Personal Care Deals on Amazon | DealStoker',
            'Curated beauty and personal care deals on Amazon.com — skincare, hair tools, grooming, and daily essentials.',
            40
        ),
        (
            'Health & Household',
            'health-household',
            'Household staples and health essentials for the medicine cabinet, laundry room, and pantry.',
            'Best Health & Household Deals on Amazon | DealStoker',
            'Find health and household deals on Amazon.com — vitamins, cleaning, paper goods, and everyday staples.',
            50
        ),
        (
            'Baby',
            'baby',
            'Practical baby and toddler essentials for feeding, sleep, travel, and daily care.',
            'Best Baby Product Deals on Amazon | DealStoker',
            'Curated baby deals on Amazon.com — feeding, diapers-adjacent essentials, travel gear, and parent favorites.',
            60
        ),
        (
            'Pets',
            'pets',
            'Dog and cat essentials — food accessories, grooming, toys, and travel gear pet owners actually use.',
            'Best Pet Product Deals on Amazon | DealStoker',
            'Shop curated pet deals on Amazon.com for dogs and cats — bowls, toys, grooming, and everyday pet must-haves.',
            70
        ),
        (
            'Office & School',
            'office-school',
            'Desk setup, stationery, backpacks, and school or WFH tools that stay useful year-round.',
            'Best Office & School Deals on Amazon | DealStoker',
            'Curated office and school deals on Amazon.com — desk accessories, stationery, backpacks, and WFH essentials.',
            80
        ),
        (
            'Tools & Home Improvement',
            'tools-home-improvement',
            'DIY and home-fix gear — hand tools, organizers, smart home basics, and repair essentials.',
            'Best Tools & Home Improvement Deals on Amazon | DealStoker',
            'Browse tools and home improvement deals on Amazon.com — DIY gear, organizers, and practical upgrade picks.',
            90
        ),
        (
            'Fashion & Accessories',
            'fashion-accessories',
            'Wearable accessories and everyday style picks — bags, watches, and simple wardrobe add-ons.',
            'Best Fashion & Accessories Deals on Amazon | DealStoker',
            'Curated fashion and accessories deals on Amazon.com — bags, watches, and everyday style essentials.',
            100
        )
) AS v(name, slug, description, seo_title, seo_description, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.slug = v.slug
);
