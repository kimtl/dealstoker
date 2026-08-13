import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: "Contact",
  description: `Contact the ${SITE_NAME} team about listings, partnerships, or privacy.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>Contact</h1>
        <p className={styles.updated}>
          We read every message. Typical response time is 1–3 business days.
        </p>
        <p>
          For general questions, listing feedback, or partnership inquiries,
          email{" "}
          <a href="mailto:hello@dealstoker.com">hello@dealstoker.com</a>.
        </p>
        <h2>Privacy requests</h2>
        <p>
          For privacy-related requests, contact{" "}
          <a href="mailto:privacy@dealstoker.com">privacy@dealstoker.com</a>.
        </p>
        <h2>Mailing address</h2>
        <p>
          {SITE_NAME}
          <br />
          United States
        </p>
        <p>
          Please do not send payment card details or Amazon account credentials
          by email.
        </p>
      </article>
    </main>
  );
}
