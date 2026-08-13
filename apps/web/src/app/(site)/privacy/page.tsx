import { buildMetadata } from "@/lib/metadata";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: `Privacy practices for ${SITE_NAME} (${SITE_DOMAIN}).`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: August 13, 2026</p>
        <p>
          This Privacy Policy describes how {SITE_NAME} (“we”, “us”) collects,
          uses, and shares information when you visit {SITE_DOMAIN}.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Usage data:</strong> pages viewed, referring URLs, browser
            type, and approximate location derived from IP address.
          </li>
          <li>
            <strong>Contact information:</strong> if you email us, we receive
            the address and message content you provide.
          </li>
          <li>
            <strong>Click events:</strong> when you use outbound product links,
            we may log a click identifier for analytics and affiliate
            attribution.
          </li>
        </ul>
        <h2>How we use information</h2>
        <p>
          We use information to operate and improve the site, measure content
          performance, prevent abuse, and communicate when you contact us.
        </p>
        <h2>Cookies and similar technologies</h2>
        <p>
          We may use essential cookies or local storage for site functionality
          (for example, admin session preferences). Analytics providers, if
          enabled, may set their own cookies subject to their policies.
        </p>
        <h2>Sharing</h2>
        <p>
          We do not sell personal information. We may share limited data with
          service providers that host or analyze the site, or when required by
          law. Outbound visits to Amazon.com are governed by Amazon’s privacy
          practices.
        </p>
        <h2>Data retention</h2>
        <p>
          We retain logs and messages only as long as needed for operations,
          security, and legal obligations.
        </p>
        <h2>Your choices</h2>
        <p>
          You can control cookies through your browser settings. To request
          deletion of information you sent us directly, contact{" "}
          <a href="mailto:privacy@dealstoker.com">privacy@dealstoker.com</a>.
        </p>
        <h2>Children</h2>
        <p>
          {SITE_NAME} is not directed to children under 13, and we do not
          knowingly collect personal information from children.
        </p>
        <h2>Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href="mailto:privacy@dealstoker.com">privacy@dealstoker.com</a> or
          see our <a href="/contact">contact page</a>.
        </p>
      </article>
    </main>
  );
}
