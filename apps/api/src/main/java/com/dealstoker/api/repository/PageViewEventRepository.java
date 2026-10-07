package com.dealstoker.api.repository;

import com.dealstoker.api.domain.PageViewEvent;
import com.dealstoker.api.util.BotUserAgents;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

/** Reporting queries count human traffic only (see {@link BotUserAgents}). */
public interface PageViewEventRepository extends JpaRepository<PageViewEvent, Long> {

    String HUMAN_P = " p.user_agent IS NOT NULL AND p.user_agent <> '' AND p.user_agent !~* '"
            + BotUserAgents.UA_REGEX + "' ";
    String HUMAN_V = " v.user_agent IS NOT NULL AND v.user_agent <> '' AND v.user_agent !~* '"
            + BotUserAgents.UA_REGEX + "' ";

    @Query(value = "SELECT COUNT(*) FROM page_view_events p WHERE p.occurred_at >= :since AND" + HUMAN_P,
            nativeQuery = true)
    long countHumanViewsSince(@Param("since") Instant since);

    @Query(value = "SELECT COUNT(*) FROM page_view_events p WHERE p.product_id IS NOT NULL "
            + "AND p.occurred_at >= :since AND" + HUMAN_P, nativeQuery = true)
    long countHumanProductViewsSince(@Param("since") Instant since);

    @Query(value = "SELECT COUNT(DISTINCT p.visitor_key) FROM page_view_events p "
            + "WHERE p.occurred_at >= :since AND p.visitor_key IS NOT NULL AND" + HUMAN_P, nativeQuery = true)
    long countDistinctVisitorsSince(@Param("since") Instant since);

    @Query(value = "SELECT COUNT(DISTINCT p.session_key) FROM page_view_events p "
            + "WHERE p.occurred_at >= :since AND p.session_key IS NOT NULL AND" + HUMAN_P, nativeQuery = true)
    long countDistinctSessionsSince(@Param("since") Instant since);

    @Query(value = """
            SELECT CAST(p.occurred_at AT TIME ZONE 'UTC' AS date) AS day,
                   COUNT(*) AS page_views,
                   COUNT(DISTINCT p.visitor_key) AS visitors,
                   COUNT(DISTINCT p.session_key) AS sessions,
                   COUNT(*) FILTER (WHERE p.product_id IS NOT NULL) AS product_views
            FROM page_view_events p
            WHERE p.occurred_at >= :since AND
            """ + HUMAN_P + """
            GROUP BY CAST(p.occurred_at AT TIME ZONE 'UTC' AS date)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyStatsSince(@Param("since") Instant since);

    @Query(value = """
            SELECT pr.id,
                   pr.slug,
                   pr.title,
                   COUNT(v.id) AS view_count
            FROM page_view_events v
            JOIN products pr ON pr.id = v.product_id
            WHERE v.occurred_at >= :since
              AND v.product_id IS NOT NULL AND
            """ + HUMAN_V + """
            GROUP BY pr.id, pr.slug, pr.title
            ORDER BY view_count DESC, pr.title ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topProductsByViewsSince(@Param("since") Instant since, @Param("limit") int limit);

    @Query(value = """
            SELECT v.product_id, COUNT(*)
            FROM page_view_events v
            WHERE v.product_id IN (:productIds)
              AND v.occurred_at >= :since AND
            """ + HUMAN_V + """
            GROUP BY v.product_id
            """, nativeQuery = true)
    List<Object[]> countByProductIdsSince(
            @Param("productIds") List<Long> productIds,
            @Param("since") Instant since
    );

    /** Total and recent (since {@code since}) human views per exact path, e.g. guide pages. */
    @Query(value = """
            SELECT p.path,
                   COUNT(*) AS total_views,
                   COUNT(*) FILTER (WHERE p.occurred_at >= :since) AS recent_views
            FROM page_view_events p
            WHERE p.path IN (:paths) AND
            """ + HUMAN_P + """
            GROUP BY p.path
            """, nativeQuery = true)
    List<Object[]> countByPaths(@Param("paths") List<String> paths, @Param("since") Instant since);
}
