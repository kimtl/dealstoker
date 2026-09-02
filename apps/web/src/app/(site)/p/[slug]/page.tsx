import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { JsonLd } from "@/components/JsonLd";
import { DealList } from "@/components/DealList";
import { getProduct, getRelatedProducts } from "@/lib/api";
import {
  formatMoney,
  formatRating,
  formatReviewCount,
} from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  productImageAlt,
  productMetaDescription,
  productMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import styles from "./product.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return buildPageMetadata({
      title: productMetaTitle(product),
      description: productMetaDescription(product),
      path: `/p/${slug}`,
      image: product.imageUrl,
      keywords: [
        product.title,
        product.brand,
        product.categoryName,
        "Amazon deal",
        "price drop",
        SITE_NAME,
      ].filter(Boolean) as string[],
    });
  } catch {
    return buildPageMetadata({
      title: "Amazon Product Deal",
      description: `Browse curated Amazon.com product deals and prices on ${SITE_NAME}.`,
      path: `/p/${slug}`,
    });
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  let related: Awaited<ReturnType<typeof getRelatedProducts>> = [];
  try {
    related = await getRelatedProducts(slug);
  } catch {
    related = [];
  }

  const price = formatMoney(product.priceAmount, product.currency);
  const listPrice = formatMoney(product.listPrice, product.currency);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount);
  const goHref = `/go/${product.slug}`;
  const imageAlt = productImageAlt(product);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    ...(product.categorySlug && product.categoryName
      ? [{ name: product.categoryName, path: `/c/${product.categorySlug}` }]
      : []),
    { name: product.title, path: `/p/${product.slug}` },
  ];

  return (
    <main className={styles.main}>
      <JsonLd
        data={[buildProductJsonLd(product), buildBreadcrumbJsonLd(breadcrumbItems)]}
      />
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {product.categorySlug && product.categoryName ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/c/${product.categorySlug}`}>
                {product.categoryName}
              </Link>
            </>
          ) : null}
          <span aria-hidden>/</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.media}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={imageAlt}
                width={720}
                height={720}
                className={styles.image}
                priority
              />
            ) : (
              <div className={styles.placeholder} />
            )}
          </div>

          <div className={styles.info}>
            {product.brand ? (
              <p className={styles.brand}>{product.brand}</p>
            ) : null}
            <h1 className={styles.title}>{product.title}</h1>
            <div className={styles.meta}>
              {price ? <span className={styles.price}>{price}</span> : null}
              {listPrice && listPrice !== price ? (
                <span className={styles.listPrice}>{listPrice}</span>
              ) : null}
              {rating ? (
                <span className={styles.rating}>
                  {rating} stars
                  {reviews ? ` · ${reviews} reviews` : ""}
                </span>
              ) : null}
            </div>
            {product.description ? (
              <p className={styles.description}>{product.description}</p>
            ) : null}
            {product.features?.length ? (
              <ul className={styles.features}>
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            ) : null}

            <div className={styles.ctaBlock}>
              <a
                href={goHref}
                className={styles.cta}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
              >
                View on Amazon
              </a>
              <AffiliateDisclosure />
              <p className={styles.siteNote}>
                Curated by {SITE_NAME}. Price and availability may change on
                Amazon.com.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.relatedTitle}>
              Related deals
            </h2>
            <DealList products={related} showNewBadge={false} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
