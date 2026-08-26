import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { getCategory, getCategoryProducts } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";
import styles from "./category.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return buildMetadata({
      title: category.seoTitle || category.name,
      description:
        category.seoDescription ||
        category.description ||
        `Shop curated ${category.name} products on DealStoker.`,
      path: `/c/${slug}`,
    });
  } catch {
    return buildMetadata({
      title: "Category",
      description: "Browse curated Amazon products on DealStoker.",
      path: `/c/${slug}`,
    });
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const sort = query.sort || "newest";
  const page = Math.max(0, Number(query.page || "0") || 0);

  let category;
  try {
    category = await getCategory(slug);
  } catch {
    notFound();
  }

  let products;
  try {
    products = await getCategoryProducts(slug, { sort, page, size: 40 });
  } catch {
    products = {
      items: [],
      page: 0,
      size: 40,
      totalElements: 0,
      totalPages: 0,
    };
  }

  const sorts = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
    { value: "rating", label: "Top rated" },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Frontpage</Link>
          <span aria-hidden>/</span>
          <span>{category.name}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{category.name}</h1>
            {category.description ? (
              <p className={styles.lead}>{category.description}</p>
            ) : null}
          </div>
          <AffiliateDisclosure />
        </header>

        <div className={styles.toolbar}>
          <p className={styles.count}>
            {products.totalElements} deal
            {products.totalElements === 1 ? "" : "s"}
          </p>
          <div className={styles.sorts} role="navigation" aria-label="Sort">
            {sorts.map((option) => (
              <Link
                key={option.value}
                href={`/c/${slug}?sort=${option.value}`}
                className={
                  sort === option.value ? styles.sortActive : styles.sortLink
                }
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <DealList
          products={products.items}
          emptyMessage="No published deals in this category yet."
        />

        {products.totalPages > 1 ? (
          <nav className={styles.pager} aria-label="Pagination">
            {page > 0 ? (
              <Link href={`/c/${slug}?sort=${sort}&page=${page - 1}`}>
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page + 1} of {products.totalPages}
            </span>
            {page + 1 < products.totalPages ? (
              <Link href={`/c/${slug}?sort=${sort}&page=${page + 1}`}>
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
