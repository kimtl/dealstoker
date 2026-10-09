package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import com.dealstoker.api.repository.SubscriberRepository;
import com.dealstoker.api.service.SubscriptionService.Outcome;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubscriptionServiceTest {

    private final SubscriberRepository repo = mock(SubscriberRepository.class);
    private final EmailSender email = mock(EmailSender.class);
    private SubscriptionService service;

    @BeforeEach
    void setUp() {
        DealStokerProperties props = new DealStokerProperties("https://www.dealstoker.com", null, null, null, null);
        service = new SubscriptionService(repo, email, props);
        when(repo.save(any(Subscriber.class))).thenAnswer(i -> i.getArgument(0));
        when(repo.findByEmail(any())).thenReturn(Optional.empty());
    }

    @Test
    void newAddressGetsAPendingRowAndAConfirmationLink() {
        assertThat(service.subscribe("  Kim@Example.COM ", "ko", "footer", "ip1")).isEqualTo(Outcome.CONFIRMATION_SENT);

        ArgumentCaptor<Subscriber> saved = ArgumentCaptor.forClass(Subscriber.class);
        verify(repo).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("kim@example.com");
        assertThat(saved.getValue().getStatus()).isEqualTo(SubscriberStatus.PENDING);
        assertThat(saved.getValue().getLocale()).isEqualTo("ko");
        assertThat(saved.getValue().getToken()).hasSizeGreaterThan(30);

        ArgumentCaptor<EmailSender.Email> sent = ArgumentCaptor.forClass(EmailSender.Email.class);
        verify(email).send(sent.capture());
        assertThat(sent.getValue().to()).isEqualTo("kim@example.com");
        assertThat(sent.getValue().html())
                .contains("https://www.dealstoker.com/newsletter/confirm?token=" + saved.getValue().getToken());
    }

    @Test
    void rejectsInvalidAddresses() {
        assertThatThrownBy(() -> service.subscribe("not-an-email", "en", null, "ip"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(email, never()).send(any());
    }

    @Test
    void activeSubscribersAreNotMailedAgain() {
        Subscriber active = new Subscriber();
        active.setEmail("a@b.co");
        active.setToken("t");
        active.setStatus(SubscriberStatus.ACTIVE);
        when(repo.findByEmail("a@b.co")).thenReturn(Optional.of(active));

        assertThat(service.subscribe("a@b.co", "en", null, "ip")).isEqualTo(Outcome.ALREADY_ACTIVE);
        verify(email, never()).send(any());
    }

    @Test
    void confirmationIsNotResentWithinTheCooldown() {
        Subscriber pending = new Subscriber();
        pending.setEmail("a@b.co");
        pending.setToken("t");
        pending.setConfirmationSentAt(Instant.now().minusSeconds(60));
        when(repo.findByEmail("a@b.co")).thenReturn(Optional.of(pending));

        assertThat(service.subscribe("a@b.co", "en", null, "ip")).isEqualTo(Outcome.IGNORED);
        verify(email, never()).send(any());
    }

    @Test
    void limitsSignUpsPerNetwork() {
        for (int i = 0; i < SubscriptionService.MAX_SIGNUPS_PER_HOUR; i++) {
            service.subscribe("user" + i + "@example.com", "en", null, "same-ip");
        }
        assertThatThrownBy(() -> service.subscribe("one-more@example.com", "en", null, "same-ip"))
                .hasMessageContaining("Too many");
        verify(email, times(SubscriptionService.MAX_SIGNUPS_PER_HOUR)).send(any());
    }

    @Test
    void confirmAndUnsubscribeByToken() {
        Subscriber s = new Subscriber();
        s.setEmail("a@b.co");
        s.setToken("tok");
        when(repo.findByToken("tok")).thenReturn(Optional.of(s));

        assertThat(service.confirm("tok")).get().extracting(Subscriber::getStatus).isEqualTo(SubscriberStatus.ACTIVE);
        assertThat(service.unsubscribe("tok")).get().extracting(Subscriber::getStatus)
                .isEqualTo(SubscriberStatus.UNSUBSCRIBED);
        assertThat(service.confirm("wrong")).isEmpty();
    }
}
