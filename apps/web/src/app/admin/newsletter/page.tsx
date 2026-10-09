"use client";

import { useEffect, useState } from "react";
import {
  adminCreateNewsletterDraft,
  adminDeleteNewsletterIssue,
  adminNewsletterIssue,
  adminNewsletterPreviewHtml,
  adminNewsletterStatus,
  adminNewsletterSubscribers,
  adminSendNewsletter,
  adminSendNewsletterTest,
  adminUpdateNewsletterIssue,
  type NewsletterStatus,
  type NewsletterSubscriberRow,
} from "@/lib/admin-api";
import { formatUpdatedAt } from "@/lib/format";
import styles from "../admin.module.css";

type Draft = { id: number; subject: string; subjectKo: string; intro: string; introKo: string };

export default function AdminNewsletterPage() {
  const [status, setStatus] = useState<NewsletterStatus | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [previewLocale, setPreviewLocale] = useState<"en" | "ko">("en");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    const [s, subs] = await Promise.all([adminNewsletterStatus(), adminNewsletterSubscribers()]);
    setStatus(s);
    setSubscribers(subs.items);
    return s;
  }

  async function openIssue(id: number) {
    const detail = await adminNewsletterIssue(id);
    setDraft({
      id,
      subject: detail.summary.subject,
      subjectKo: detail.summary.subjectKo || "",
      intro: detail.intro || "",
      introKo: detail.introKo || "",
    });
    setPreviewHtml(await adminNewsletterPreviewHtml(id, previewLocale));
  }

  useEffect(() => {
    load()
      .then((s) => {
        const openDraft = s.issues.find((i) => i.status === "DRAFT");
        if (openDraft) return openIssue(openDraft.id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = status ? status.readiness.emailConfigured && status.readiness.postalAddressSet : false;

  return (
    <div>
      <h1 className={styles.title}>Newsletter</h1>
      <p className={styles.muted}>
        Weekly email with new guides, the most viewed products and the biggest discounts. Sign-ups
        are double opt-in; every email has a one-click unsubscribe and your postal address.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {note ? <p className={styles.okNote}>{note}</p> : null}

      {status ? (
        <div className={styles.importBox} style={{ marginBottom: "1rem" }}>
          <p>
            <strong>{status.active}</strong> confirmed · {status.pending} waiting for confirmation ·{" "}
            {status.unsubscribed} unsubscribed
          </p>
          <p className={styles.muted}>
            Email: {status.readiness.emailConfigured ? `ready (${status.readiness.from})` : "not configured — set RESEND_API_KEY and NEWSLETTER_FROM"}
            {" · "}Postal address: {status.readiness.postalAddressSet ? "set" : "missing — set NEWSLETTER_POSTAL_ADDRESS (required by CAN-SPAM)"}
          </p>
          <p className={styles.muted}>
            Weekly draft: {status.scheduleEnabled ? "on (Thursdays, US Eastern)" : "off"} · Auto-send:{" "}
            {status.autoSend ? "on" : "off — review and send drafts here"}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const created = await adminCreateNewsletterDraft();
                  await load();
                  await openIssue(created.id);
                  setNote("Draft created from this week's guides and deals.");
                })
              }
            >
              Create draft now
            </button>
          </div>
        </div>
      ) : null}

      {draft ? (
        <div className={styles.importBox} style={{ marginBottom: "1rem" }}>
          <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
            Draft #{draft.id}
          </h3>
          <div className={styles.form}>
            <label>
              Subject (English)
              <input value={draft.subject} maxLength={200} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </label>
            <label>
              Subject (Korean subscribers)
              <input value={draft.subjectKo} maxLength={200} onChange={(e) => setDraft({ ...draft, subjectKo: e.target.value })} />
            </label>
            <label>
              Intro (optional, English) — a short personal note reads better than a generic greeting
              <textarea rows={3} value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} />
            </label>
            <label>
              Intro (optional, Korean)
              <textarea rows={3} value={draft.introKo} onChange={(e) => setDraft({ ...draft, introKo: e.target.value })} />
            </label>
          </div>
          <div className={styles.actions} style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className={styles.buttonSecondary}
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await adminUpdateNewsletterIssue(draft.id, {
                    subject: draft.subject,
                    subjectKo: draft.subjectKo || null,
                    intro: draft.intro || null,
                    introKo: draft.introKo || null,
                  });
                  setPreviewHtml(await adminNewsletterPreviewHtml(draft.id, previewLocale));
                  await load();
                  setNote("Saved.");
                })
              }
            >
              Save &amp; refresh preview
            </button>
            <select
              value={previewLocale}
              onChange={(e) => {
                const next = e.target.value as "en" | "ko";
                setPreviewLocale(next);
                act(async () => setPreviewHtml(await adminNewsletterPreviewHtml(draft.id, next)));
              }}
            >
              <option value="en">Preview: English</option>
              <option value="ko">Preview: Korean</option>
            </select>
            <input
              type="email"
              placeholder="test@your-inbox.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{ maxWidth: "16rem" }}
            />
            <button
              type="button"
              className={styles.buttonSecondary}
              disabled={busy || !ready || !testEmail}
              onClick={() =>
                act(async () => {
                  await adminSendNewsletterTest(draft.id, testEmail, previewLocale);
                  setNote(`Test sent to ${testEmail}.`);
                })
              }
            >
              Send test
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={busy || !ready || !status?.active}
              onClick={() => {
                if (!confirm(`Send this issue to ${status?.active ?? 0} confirmed subscribers now?`)) return;
                act(async () => {
                  const result = await adminSendNewsletter(draft.id);
                  setDraft(null);
                  setPreviewHtml("");
                  await load();
                  setNote(`Sending to ${result.recipients} subscribers in the background.`);
                });
              }}
            >
              Send to {status?.active ?? 0} subscribers
            </button>
            <button
              type="button"
              className={styles.buttonDanger}
              disabled={busy}
              onClick={() => {
                if (!confirm("Delete this draft?")) return;
                act(async () => {
                  await adminDeleteNewsletterIssue(draft.id);
                  setDraft(null);
                  setPreviewHtml("");
                  await load();
                });
              }}
            >
              Delete draft
            </button>
          </div>
          {previewHtml ? (
            <iframe
              title="Newsletter preview"
              srcDoc={previewHtml}
              sandbox=""
              style={{ width: "100%", height: "70vh", border: "1px solid #ddd", borderRadius: 8, marginTop: "1rem", background: "#fff" }}
            />
          ) : null}
        </div>
      ) : null}

      <h2 className={styles.sectionTitle}>Issues</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(status?.issues ?? []).map((issue) => (
              <tr key={issue.id}>
                <td>{issue.id}</td>
                <td>{issue.subject}</td>
                <td>{issue.status}</td>
                <td>
                  {issue.status === "DRAFT"
                    ? "—"
                    : `${issue.sentCount}/${issue.recipientCount}${issue.failedCount ? ` (${issue.failedCount} failed)` : ""}`}
                </td>
                <td>{formatUpdatedAt(issue.createdAt)}</td>
                <td>
                  <button type="button" className={styles.buttonSecondary} onClick={() => act(() => openIssue(issue.id))}>
                    {issue.status === "DRAFT" ? "Edit" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={styles.sectionTitle}>Recent subscribers</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Lang</th>
              <th>Source</th>
              <th>Signed up</th>
              <th>Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{s.status}</td>
                <td>{s.locale}</td>
                <td>{s.source || "—"}</td>
                <td>{formatUpdatedAt(s.createdAt)}</td>
                <td>{formatUpdatedAt(s.confirmedAt) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
