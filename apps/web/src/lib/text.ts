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
