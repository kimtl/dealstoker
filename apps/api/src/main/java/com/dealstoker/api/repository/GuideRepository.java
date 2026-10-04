package com.dealstoker.api.repository;

import com.dealstoker.api.domain.Guide;
import com.dealstoker.api.domain.GuideStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuideRepository extends JpaRepository<Guide, Long> {

    Optional<Guide> findBySlug(String slug);

    Optional<Guide> findBySlugAndStatus(String slug, GuideStatus status);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Page<Guide> findByStatusOrderByPublishedAtDescUpdatedAtDesc(GuideStatus status, Pageable pageable);

    Page<Guide> findByStatusAndCategorySlugOrderByPublishedAtDescUpdatedAtDesc(
            GuideStatus status, String categorySlug, Pageable pageable);

    Page<Guide> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    Page<Guide> findByStatusOrderByUpdatedAtDesc(GuideStatus status, Pageable pageable);

    List<Guide> findByStatusOrderByPublishedAtDesc(GuideStatus status, Pageable pageable);
}
