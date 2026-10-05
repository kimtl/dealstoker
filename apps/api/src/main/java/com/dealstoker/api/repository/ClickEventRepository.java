package com.dealstoker.api.repository;

import com.dealstoker.api.domain.ClickEvent;
import com.dealstoker.api.util.BotUserAgents;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

/**
 * Every reporting query here counts human traffic only: rows whose user agent is
 * missing or matches {@link BotUserAgents#UA_REGEX} are excluded, so clicks that
 * were recorded before bot filtering existed no longer inflate the stats.
 */
public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

    String HUMAN_C = " c.user_agent IS NOT NULL AND c.user_agent <> '' AND c.user_agent !~* '"
            + BotUserAgents.UA_REGEX + "' ";

    boolean existsByProductIdAndSessionIdAndOccurredAtAfter(Long productId, String sessionId, Instant since);

    boolean existsByProductIdAndIpHashAndOccurredAtAfter(Long productId, String ipHash, Instant since);

    @Query(value = "SELECT COUNT(*) FROM click_events c WHERE c.occurred_at >= :since AND" + HUMAN_C,
            nativeQuery = true)
    long countHumanClicksSince(@Param("since") Instant since);

    @Query(value = """
            SELECT c.product_id, COUNT(*)
            FROM click_events c
            WHERE c.product_id IN (:productIds) AND
            """ + HUMAN_C + """
            GROUP BY c.product_id
            """, nativeQuery = true)
    List<Object[]> countHumanClicksByProductIds(@Param("productIds") List<Long> productIds);

    @Query(value = """
            SELECT CAST(c.occurred_at AT TIME ZONE 'UTC' AS date) AS day,
                   COUNT(*) AS clicks
            FROM click_events c
            WHERE c.occurred_at >= :since AND
            """ + HUMAN_C + """
            GROUP BY CAST(c.occurred_at AT TIME ZONE 'UTC' AS date)
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
            WHERE c.occurred_at >= :since AND
            """ + HUMAN_C + """
            GROUP BY p.id, p.slug, p.title
            ORDER BY click_count DESC, p.title ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topProductsByClicksSince(@Param("since") Instant since, @Param("limit") int limit);
}
