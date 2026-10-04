import type { ComponentProps } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownBody.module.css";

type Props = {
  markdown: string;
  className?: string;
};

function isExternal(href: string | undefined): boolean {
  return Boolean(href && /^https?:\/\//i.test(href));
}

type MarkdownNodeProps = { node?: unknown };

// react-markdown passes the mdast `node`; strip it so it never reaches the DOM.
function MarkdownLink({
  href,
  children,
  node: _node,
  ...rest
}: ComponentProps<"a"> & MarkdownNodeProps) {
  void _node;
  if (isExternal(href)) {
    const amazon = /amazon\./i.test(href || "");
    return (
      <a
        href={href}
        target="_blank"
        rel={amazon ? "sponsored noopener noreferrer" : "nofollow noopener noreferrer"}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function MarkdownImage({ src, alt }: ComponentProps<"img"> & MarkdownNodeProps) {
  if (!src || typeof src !== "string") return null;
  // Author-supplied hosts vary; keep it a plain <img> to avoid next/image host errors.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt || ""} loading="lazy" decoding="async" />;
}

/**
 * Renders editorial Markdown (GFM). Raw HTML is never rendered — react-markdown
 * escapes it by default — so admin-authored content cannot inject script.
 */
export function MarkdownBody({ markdown, className }: Props) {
  return (
    <div className={`${styles.prose} ${className ?? ""}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{ a: MarkdownLink, img: MarkdownImage }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
