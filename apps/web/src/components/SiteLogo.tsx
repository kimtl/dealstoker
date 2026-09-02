import Image from "next/image";
import { SITE_NAME } from "@/lib/site";
import styles from "./SiteLogo.module.css";

type Props = {
  variant?: "full" | "mark";
  priority?: boolean;
  className?: string;
  /** Visual height in CSS pixels (width follows aspect). */
  height?: number;
};

const FULL = {
  src: "/brand/dealstoker-logo.png",
  width: 737,
  height: 501,
  alt: `${SITE_NAME}.com logo`,
};

const MARK = {
  src: "/brand/dealstoker-mark.png",
  width: 223,
  height: 223,
  alt: `${SITE_NAME} mark`,
};

export function SiteLogo({
  variant = "full",
  priority = false,
  className,
  height = 40,
}: Props) {
  const asset = variant === "mark" ? MARK : FULL;
  const width = Math.round((asset.width / asset.height) * height);

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={width}
      height={height}
      priority={priority}
      className={`${styles.logo} ${className || ""}`.trim()}
      style={{ width, height }}
    />
  );
}
