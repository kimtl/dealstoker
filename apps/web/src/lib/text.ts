/** Split plain text into paragraph strings for semantic <p> rendering. */
export function splitIntoParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      if (!block.includes("\n")) return [block];
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const bulletHeavy =
        lines.filter((line) => /^([-•*]|\d+\.)\s+/.test(line)).length >= 2;
      const labeled = lines.some(
        (line) => /^[A-Za-z][^:\n]{1,40}:\s*/.test(line) || /:\s*$/.test(line),
      );
      if (bulletHeavy || labeled) {
        return [lines.join("\n")];
      }
      return lines;
    });
}

/** Hard truncate at a word boundary without an ellipsis (for stored SEO fields). */
export function truncateAtWord(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  let slice = cleaned.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= Math.floor(max * 0.55)) {
    slice = slice.slice(0, lastSpace);
  }
  return slice.trimEnd();
}

/** Truncate on a word boundary when possible (avoids "Intel Co…"). */
export function clampText(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${truncateAtWord(cleaned, Math.max(1, max - 1))}…`;
}

/** Strip Amazon marketplace prefixes that leak into scraped meta. */
export function sanitizeMetaCopy(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^Amazon\.com\s*:\s*/i, "")
    .replace(/^Amazon\s*:\s*/i, "");
}
