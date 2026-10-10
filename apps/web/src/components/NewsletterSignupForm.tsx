"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/google-tag";
import { API_PROXY_PREFIX } from "@/lib/site";
import styles from "./NewsletterSignup.module.css";

export type NewsletterLabels = {
  title: string;
  lead: string;
  placeholder: string;
  submit: string;
  sending: string;
  checkInbox: string;
  error: string;
  privacyNote: string;
  privacyLink: string;
};

type Props = {
  labels: NewsletterLabels;
  locale: string;
  /** Where the form sits (footer, guide…), stored with the subscriber for reporting. */
  source: string;
  privacyHref: string;
  variant?: "card" | "footer";
};

export function NewsletterSignupForm({ labels, locale, source, privacyHref, variant = "card" }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch(`${API_PROXY_PREFIX}/api/v1/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source, website }),
      });
      if (res.ok) {
        trackEvent("sign_up", { method: "newsletter", source });
        setState("done");
        setMessage(labels.checkInbox);
        return;
      }
      const data = (await res.json().catch(() => null)) as { detail?: string } | null;
      setState("error");
      setMessage(data?.detail || labels.error);
    } catch {
      setState("error");
      setMessage(labels.error);
    }
  }

  return (
    <section className={variant === "footer" ? styles.footer : styles.card} aria-label={labels.title}>
      <p className={styles.title}>{labels.title}</p>
      <p className={styles.lead}>{labels.lead}</p>
      {state === "done" ? (
        <p className={styles.success} role="status">
          {message}
        </p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <label className="sr-only" htmlFor={`newsletter-email-${source}`}>
            {labels.placeholder}
          </label>
          <input
            id={`newsletter-email-${source}`}
            className={styles.input}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={labels.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* Honeypot: hidden from people, often filled by bots. */}
          <input
            className={styles.honeypot}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <button className={styles.button} type="submit" disabled={state === "sending"}>
            {state === "sending" ? labels.sending : labels.submit}
          </button>
        </form>
      )}
      {state === "error" && message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
      <p className={styles.note}>
        {labels.privacyNote} <a href={privacyHref}>{labels.privacyLink}</a>
      </p>
    </section>
  );
}
