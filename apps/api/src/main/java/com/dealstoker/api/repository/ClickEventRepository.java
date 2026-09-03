package com.dealstoker.api.repository;

import com.dealstoker.api.domain.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {
    long countByProductId(Long productId);

    long countByOccurredAtGreaterThanEqual(Instant since);

    @Query("""
            SELECT c.product.id, COUNT(c)
            FROM ClickEvent c
            WHERE c.product.id IN :productIds
            GROUP BY c.product.id
            """)
    List<Object[]> countByProductIds(@Param("productIds") List<Long> productIds);

    @Query("""
            SELECT c.product.id, COUNT(c)
            FROM ClickEvent c
            WHERE c.product.id IN :productIds
              AND c.occurredAt >= :since
            GROUP BY c.product.id
            """)
    List<Object[]> countByProductIdsSince(
            @Param("productIds") List<Long> productIds,
            @Param("since") Instant since
    );

    @Query(value = """
            SELECT CAST(occurred_at AT TIME ZONE 'UTC' AS date) AS day,
                   COUNT(*) AS clicks
            FROM click_events
            WHERE occurred_at >= :since
            GROUP BY CAST(occurred_at AT TIME ZONE 'UTC' AS date)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyClicksSince(@Param("since") Instant since);

    @Query(value = """
            SELECT p.id,
                   p.slug,
                   p.title,
                   COUNT(c.id) AS click_count
            FROM click_events c
            JOIN products p ON p.id = c.product_id
            WHERE c.occurred_at >= :since
            GROUP BY p.id, p.slug, p.title
            ORDER BY click_count DESC, p.title ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topProductsByClicksSince(@Param("since") Instant since, @Param("limit") int limit);
}
