package com.dealstoker.api.repository;

import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySlugAndStatus(String slug, ProductStatus status);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySourceAndExternalIdAndMarketplace(String source, String externalId, String marketplace);

    boolean existsBySourceAndExternalIdAndMarketplaceAndIdNot(
            String source, String externalId, String marketplace, Long id);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
              AND (:categoryId IS NULL OR p.primaryCategory.id = :categoryId)
              AND (:q IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
            """)
    Page<Product> searchPublished(
            @Param("status") ProductStatus status,
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            Pageable pageable);

    List<Product> findTop12ByStatusAndPrimaryCategoryIdAndIdNotOrderByPublishedAtDesc(
            ProductStatus status, Long categoryId, Long productId);

    List<Product> findTop12ByStatusOrderByPublishedAtDesc(ProductStatus status);

    List<Product> findTop5ByStatusAndFeaturedTrueOrderByFeaturedRankAscPublishedAtDesc(ProductStatus status);

    @Query(value = """
            SELECT p.*
            FROM products p
            LEFT JOIN click_events c ON c.product_id = p.id
            WHERE p.status = :status
            GROUP BY p.id
            ORDER BY COUNT(c.id) DESC, p.published_at DESC NULLS LAST
            LIMIT :limit
            """, nativeQuery = true)
    List<Product> findTopByBuyClicks(@Param("status") String status, @Param("limit") int limit);

    long countByStatus(ProductStatus status);
}
