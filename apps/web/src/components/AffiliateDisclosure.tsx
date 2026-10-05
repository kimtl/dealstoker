import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import styles from "./AffiliateDisclosure.module.css";

type Props = {
  className?: string;
};

export async function AffiliateDisclosure({ className }: Props) {
  const t = await getMessages();
  return (
    <p className={`${styles.text} ${className || ""}`}>
      {t.affiliateShort} {t.affiliateNoCost}{" "}
      <Link href="/disclosure">{t.fullDisclosure}</Link>
    </p>
  );
}
