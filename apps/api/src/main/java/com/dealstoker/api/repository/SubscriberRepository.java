package com.dealstoker.api.repository;

import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    Optional<Subscriber> findByEmail(String email);

    Optional<Subscriber> findByToken(String token);

    long countByStatus(SubscriberStatus status);

    List<Subscriber> findByStatusOrderByIdAsc(SubscriberStatus status);

    Page<Subscriber> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Subscriber> findByStatusOrderByCreatedAtDesc(SubscriberStatus status, Pageable pageable);
}
