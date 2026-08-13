import Link from "next/link";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/site";
import styles from "./AffiliateDisclosure.module.css";

type Props = {
  className?: string;
};

export function AffiliateDisclosure({ className }: Props) {
  return (
    <p className={`${styles.text} ${className || ""}`}>
      {AFFILIATE_DISCLOSURE_SHORT}{" "}
      <Link href="/disclosure">Full disclosure</Link>
    </p>
  );
}
