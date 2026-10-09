package com.dealstoker.api.web;

import com.dealstoker.api.domain.NewsletterIssue;
import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import com.dealstoker.api.repository.SubscriberRepository;
import com.dealstoker.api.service.NewsletterRenderer.IssueContent;
import com.dealstoker.api.service.NewsletterService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/newsletter")
public class AdminNewsletterController {

    public record IssueSummary(Long id, String subject, String subjectKo, String status, int recipientCount,
                               int sentCount, int failedCount, Instant createdAt, Instant sentAt) {
        static IssueSummary from(NewsletterIssue issue) {
            return new IssueSummary(issue.getId(), issue.getSubject(), issue.getSubjectKo(),
                    issue.getStatus().name(), issue.getRecipientCount(), issue.getSentCount(),
                    issue.getFailedCount(), issue.getCreatedAt(), issue.getSentAt());
        }
    }

    public record IssueDetail(IssueSummary summary, String intro, String introKo, IssueContent content) {}

    public record Status(NewsletterService.Readiness readiness, boolean scheduleEnabled, boolean autoSend,
                         long active, long pending, long unsubscribed, List<IssueSummary> issues) {}

    public record SubscriberRow(Long id, String email, String status, String locale, String source,
                                Instant createdAt, Instant confirmedAt, Instant lastSentAt) {
        static SubscriberRow from(Subscriber s) {
            return new SubscriberRow(s.getId(), s.getEmail(), s.getStatus().name(), s.getLocale(), s.getSource(),
                    s.getCreatedAt(), s.getConfirmedAt(), s.getLastSentAt());
        }
    }

    public record IssueUpdate(String subject, String subjectKo, String intro, String introKo) {}

    public record TestRequest(String email, String locale) {}

    private final NewsletterService newsletterService;
    private final SubscriberRepository subscribers;

    public AdminNewsletterController(NewsletterService newsletterService, SubscriberRepository subscribers) {
        this.newsletterService = newsletterService;
        this.subscribers = subscribers;
    }

    @GetMapping("/status")
    public Status status() {
        return new Status(newsletterService.readiness(), newsletterService.isScheduleEnabled(),
                newsletterService.isAutoSend(),
                subscribers.countByStatus(SubscriberStatus.ACTIVE),
                subscribers.countByStatus(SubscriberStatus.PENDING),
                subscribers.countByStatus(SubscriberStatus.UNSUBSCRIBED),
                newsletterService.recentIssues(20).stream().map(IssueSummary::from).toList());
    }

    @GetMapping("/subscribers")
    public Map<String, Object> subscribers(
            @RequestParam(required = false) SubscriberStatus status,
            @RequestParam(defaultValue = "0") int page
    ) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), 50);
        Page<Subscriber> result = status == null
                ? subscribers.findAllByOrderByCreatedAtDesc(pageable)
                : subscribers.findByStatusOrderByCreatedAtDesc(status, pageable);
        return Map.of("items", result.getContent().stream().map(SubscriberRow::from).toList(),
                "totalElements", result.getTotalElements());
    }

    @PostMapping("/issues")
    public IssueSummary createDraft() {
        return IssueSummary.from(newsletterService.createDraft());
    }

    @GetMapping("/issues/{id}")
    public IssueDetail issue(@PathVariable Long id) {
        NewsletterIssue issue = newsletterService.require(id);
        return new IssueDetail(IssueSummary.from(issue), issue.getIntro(), issue.getIntroKo(),
                newsletterService.content(issue));
    }

    @PutMapping("/issues/{id}")
    public IssueSummary update(@PathVariable Long id, @RequestBody IssueUpdate body) {
        return IssueSummary.from(newsletterService.update(id, body.subject(), body.subjectKo(), body.intro(),
                body.introKo()));
    }

    @DeleteMapping("/issues/{id}")
    public Map<String, Boolean> delete(@PathVariable Long id) {
        newsletterService.delete(id);
        return Map.of("deleted", true);
    }

    @GetMapping(value = "/issues/{id}/preview", produces = MediaType.TEXT_HTML_VALUE)
    public String preview(@PathVariable Long id, @RequestParam(defaultValue = "en") String locale) {
        return newsletterService.render(newsletterService.require(id), locale, "preview").html();
    }

    @PostMapping("/issues/{id}/test")
    public Map<String, Boolean> test(@PathVariable Long id, @RequestBody TestRequest body) {
        newsletterService.sendTest(id, body.email(), body.locale());
        return Map.of("sent", true);
    }

    @PostMapping("/issues/{id}/send")
    public ResponseEntity<Map<String, Integer>> send(@PathVariable Long id) {
        int recipients = newsletterService.startSend(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("recipients", recipients));
    }
}
