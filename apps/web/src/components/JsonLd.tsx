type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Serialize JSON-LD safely for embedding in HTML. */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
