package com.dealstoker.api.repository;

import com.dealstoker.api.domain.PageViewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PageViewEventRepository extends JpaRepository<PageViewEvent, Long> {

    long countByOccurredAtGreaterThanEqual(Instant since);

    long countByProductIsNotNullAndOccurredAtGreaterThanEqual(Instant since);

    @Query("""
            SELECT COUNT(DISTINCT p.visitorKey)
            FROM PageViewEvent p
            WHERE p.occurredAt >= :since
              AND p.visitorKey IS NOT NULL
            """)
    long countDistinctVisitorsSince(@Param("since") Instant since);

    @Query("""
            SELECT COUNT(DISTINCT p.sessionKey)
            FROM PageViewEvent p
            WHERE p.occurredAt >= :since
              AND p.sessionKey IS NOT NULL
            """)
    long countDistinctSessionsSince(@Param("since") Instant since);

    @Query(value = """
            SELECT CAST(occurred_at AT TIME ZONE 'UTC' AS date) AS day,
                   COUNT(*) AS page_views,
                   COUNT(DISTINCT visitor_key) AS visitors,
                   COUNT(DISTINCT session_key) AS sessions,
                   COUNT(*) FILTER (WHERE product_id IS NOT NULL) AS product_views
            FROM page_view_events
            WHERE occurred_at >= :since
            GROUP BY CAST(occurred_at AT TIME ZONE 'UTC' AS date)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyStatsSince(@Param("since") Instant since);

    @Query(value = """
            SELECT p.id,
                   p.slug,
                   p.title,
                   COUNT(v.id) AS view_count
            FROM page_view_events v
            JOIN products p ON p.id = v.product_id
            WHERE v.occurred_at >= :since
              AND v.product_id IS NOT NULL
            GROUP BY p.id, p.slug, p.title
            ORDER BY view_count DESC, p.title ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topProductsByViewsSince(@Param("since") Instant since, @Param("limit") int limit);

    @Query("""
            SELECT v.product.id, COUNT(v)
            FROM PageViewEvent v
            WHERE v.product.id IN :productIds
              AND v.occurredAt >= :since
            GROUP BY v.product.id
            """)
    List<Object[]> countByProductIdsSince(
            @Param("productIds") List<Long> productIds,
            @Param("since") Instant since
    );

    long countByProductId(Long productId);
}
