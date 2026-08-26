package com.dealstoker.api.repository;

import com.dealstoker.api.domain.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {
    long countByProductId(Long productId);

    @Query("""
            SELECT c.product.id, COUNT(c)
            FROM ClickEvent c
            WHERE c.product.id IN :productIds
            GROUP BY c.product.id
            """)
    List<Object[]> countByProductIds(@Param("productIds") List<Long> productIds);
}
