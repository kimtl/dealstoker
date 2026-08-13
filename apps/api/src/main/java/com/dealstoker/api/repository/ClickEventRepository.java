package com.dealstoker.api.repository;

import com.dealstoker.api.domain.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {
    long countByProductId(Long productId);
}
