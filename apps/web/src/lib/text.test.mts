import assert from "node:assert/strict";
import test from "node:test";
import { splitIntoParagraphs } from "./text.ts";

test("empty text yields no paragraphs", () => {
  assert.deepEqual(splitIntoParagraphs(""), []);
  assert.deepEqual(splitIntoParagraphs(null), []);
});

test("blank-line blocks become paragraphs", () => {
  assert.deepEqual(splitIntoParagraphs("One paragraph."), ["One paragraph."]);
  assert.deepEqual(splitIntoParagraphs("First.\n\nSecond."), [
    "First.",
    "Second.",
  ]);
});

test("labeled recommendation blocks stay together", () => {
  assert.deepEqual(
    splitIntoParagraphs(
      "One-line takeaway: Hello\nWhy we recommend:\n- A\n- B",
    ),
    ["One-line takeaway: Hello\nWhy we recommend:\n- A\n- B"],
  );
});
