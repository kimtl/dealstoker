package com.dealstoker.api.repository;

import com.dealstoker.api.domain.NewsletterIssue;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface NewsletterIssueRepository extends JpaRepository<NewsletterIssue, Long> {

    List<NewsletterIssue> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByCreatedAtAfter(Instant since);
}
