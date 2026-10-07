import assert from "node:assert/strict";
import test from "node:test";
import { extractProductSlugs, splitGuideBody, stripShortcodes, wordCount } from "./guides.ts";

test("splitGuideBody separates markdown and product shortcodes", () => {
  const body = "## Intro\n\nText.\n\n{{product:cosori-12-in-1-air-fryer-oven}}\n\nMore text {{ product: Anker-737-Power-Bank-24k }} end.";
  const segments = splitGuideBody(body);
  assert.deepEqual(
    segments.map((s) => (s.type === "product" ? `P:${s.slug}` : "M")),
    ["M", "P:cosori-12-in-1-air-fryer-oven", "M", "P:anker-737-power-bank-24k", "M"],
  );
  assert.equal(segments[0].type === "markdown" && segments[0].markdown.trim(), "## Intro\n\nText.");
});

test("splitGuideBody without shortcodes is a single markdown segment", () => {
  assert.deepEqual(splitGuideBody("plain **md**"), [{ type: "markdown", markdown: "plain **md**" }]);
  assert.deepEqual(splitGuideBody(""), []);
});

test("extractProductSlugs dedupes and keeps order", () => {
  assert.deepEqual(
    extractProductSlugs("{{product:b}} x {{product:a}} y {{product:b}}"),
    ["b", "a"],
  );
});

test("stripShortcodes removes placeholders and collapses blank lines", () => {
  assert.equal(stripShortcodes("a\n\n{{product:x}}\n\nb"), "a\n\nb");
});

test("malformed shortcodes are left as text", () => {
  const body = "{{product:}} {{product: has space }} {{item:x}}";
  assert.deepEqual(splitGuideBody(body), [{ type: "markdown", markdown: body }]);
});

test("wordCount ignores shortcodes, markdown symbols and table rules", () => {
  const body =
    "## Pick the size first\n\nA 6-quart basket feeds four.\n\n{{product:cosori-oven}}\n\n| Model | Best for |\n| --- | --- |\n| Cosori | Families |";
  assert.equal(wordCount(body), 15);
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount(null), 0);
});
