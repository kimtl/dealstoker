import { NewsletterSignupForm } from "@/components/NewsletterSignupForm";
import { getI18n } from "@/lib/i18n";

/** Weekly newsletter sign-up (double opt-in). Server wrapper that supplies translated labels. */
export async function NewsletterSignup({
  source,
  variant = "card",
}: {
  source: string;
  variant?: "card" | "footer";
}) {
  const { locale, t } = await getI18n();
  return (
    <NewsletterSignupForm
      locale={locale}
      source={source}
      variant={variant}
      privacyHref={locale === "ko" ? "/privacy?hl=ko" : "/privacy"}
      labels={{
        title: t.newsletterTitle,
        lead: t.newsletterLead,
        placeholder: t.newsletterPlaceholder,
        submit: t.newsletterSubmit,
        sending: t.newsletterSending,
        checkInbox: t.newsletterCheckInbox,
        error: t.newsletterError,
        privacyNote: t.newsletterPrivacyNote,
        privacyLink: t.privacy,
      }}
    />
  );
}
