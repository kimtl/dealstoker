"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { API_PROXY_PREFIX } from "@/lib/site";

type Props = {
  action: "confirm" | "unsubscribe";
  token: string | null;
  labels: {
    title: string;
    body: string;
    working: string;
    done: string;
    invalid: string;
    button?: string;
    home: string;
  };
  homeHref: string;
  classNames: { title: string; button: string };
};

/**
 * Confirm runs on load (link scanners rarely run JavaScript). Unsubscribe waits for a click so a
 * mail scanner opening the link can't unsubscribe anyone; one-click unsubscribe from the mail app
 * uses the List-Unsubscribe header instead.
 */
export function NewsletterTokenAction({ action, token, labels, homeHref, classNames }: Props) {
  const [state, setState] = useState<"idle" | "working" | "done" | "invalid">(
    token ? (action === "confirm" ? "working" : "idle") : "invalid",
  );
  const started = useRef(false);

  async function run() {
    if (!token) return;
    setState("working");
    try {
      const res = await fetch(`${API_PROXY_PREFIX}/api/v1/newsletter/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? "done" : "invalid");
    } catch {
      setState("invalid");
    }
  }

  useEffect(() => {
    if (action === "confirm" && token && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className={classNames.title}>{labels.title}</h1>
      {state === "idle" ? (
        <>
          <p>{labels.body}</p>
          <p>
            <button type="button" className={classNames.button} onClick={() => void run()}>
              {labels.button}
            </button>
          </p>
        </>
      ) : null}
      {state === "working" ? <p role="status">{labels.working}</p> : null}
      {state === "done" ? <p role="status">{labels.done}</p> : null}
      {state === "invalid" ? <p role="alert">{labels.invalid}</p> : null}
      <p>
        <Link href={homeHref}>{labels.home}</Link>
      </p>
    </>
  );
}
