package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.NewsletterIssue;
import com.dealstoker.api.domain.NewsletterIssueStatus;
import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import com.dealstoker.api.repository.GuideRepository;
import com.dealstoker.api.repository.NewsletterIssueRepository;
import com.dealstoker.api.repository.SubscriberRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NewsletterServiceTest {

    private final SubscriberRepository subscribers = mock(SubscriberRepository.class);
    private final NewsletterIssueRepository issues = mock(NewsletterIssueRepository.class);
    private final EmailSender email = mock(EmailSender.class);

    private NewsletterService service(String postalAddress) {
        return new NewsletterService(subscribers, issues, mock(GuideRepository.class), mock(ProductService.class),
                email, new TransactionTemplate(mock(PlatformTransactionManager.class)),
                new DealStokerProperties("https://www.dealstoker.com", null, null, null, null),
                postalAddress, true, false, 0, ms -> { });
    }

    private NewsletterIssue draft() {
        NewsletterIssue issue = mock(NewsletterIssue.class);
        when(issue.getId()).thenReturn(5L);
        when(issue.getStatus()).thenReturn(NewsletterIssueStatus.DRAFT);
        when(issue.getSubject()).thenReturn("This week");
        when(issue.getContentJson()).thenReturn("{\"guides\":[],\"topViewed\":[],\"deals\":[]}");
        when(issues.findById(5L)).thenReturn(Optional.of(issue));
        return issue;
    }

    private Subscriber subscriber(long id, SubscriberStatus status) {
        Subscriber s = mock(Subscriber.class);
        when(s.getId()).thenReturn(id);
        when(s.getEmail()).thenReturn("s" + id + "@example.com");
        when(s.getToken()).thenReturn("tok" + id);
        when(s.getLocale()).thenReturn("en");
        when(s.getStatus()).thenReturn(status);
        when(subscribers.findById(id)).thenReturn(Optional.of(s));
        return s;
    }

    @Test
    void refusesToSendWithoutAPostalAddress() {
        when(email.isConfigured()).thenReturn(true);
        draft();
        assertThatThrownBy(() -> service("").startSend(5L)).hasMessageContaining("NEWSLETTER_POSTAL_ADDRESS");
    }

    @Test
    void refusesToSendWithoutEmailConfigured() {
        when(email.isConfigured()).thenReturn(false);
        draft();
        assertThatThrownBy(() -> service("PO Box 1").startSend(5L)).hasMessageContaining("RESEND_API_KEY");
    }

    @Test
    void sendsToActiveSubscribersWithOneClickUnsubscribeAndSkipsLeavers() {
        when(email.isConfigured()).thenReturn(true);
        draft();
        subscriber(1, SubscriberStatus.ACTIVE);
        subscriber(2, SubscriberStatus.UNSUBSCRIBED); // left after the send was queued

        service("PO Box 1, Atlanta, GA").sendAll(5L, List.of(1L, 2L));

        ArgumentCaptor<EmailSender.Email> sent = ArgumentCaptor.forClass(EmailSender.Email.class);
        verify(email, times(1)).send(sent.capture());
        EmailSender.Email message = sent.getValue();
        assertThat(message.to()).isEqualTo("s1@example.com");
        assertThat(message.headers())
                .containsEntry("List-Unsubscribe",
                        "<https://www.dealstoker.com/api/backend/api/v1/newsletter/unsubscribe?token=tok1>")
                .containsEntry("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
        assertThat(message.html()).contains("unsubscribe?token=tok1").contains("PO Box 1, Atlanta, GA");
        verify(issues).save(any(NewsletterIssue.class));
    }
}
