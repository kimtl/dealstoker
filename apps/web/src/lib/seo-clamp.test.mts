import assert from "node:assert/strict";
import test from "node:test";
import {
  clampText,
  sanitizeMetaCopy,
  truncateAtWord,
} from "./text.ts";

test("clampText cuts on word boundary", () => {
  const out = clampText(
    "Alienware 16 Aurora Gaming Laptop, NVIDIA RTX 5060, Intel Core 7 240H",
    45,
  );
  assert.ok(out.endsWith("…"));
  assert.equal(out.includes("Intel Co…"), false);
  assert.ok(out.length <= 45);
});

test("truncateAtWord has no ellipsis", () => {
  const out = truncateAtWord(
    "Alienware 16 Aurora Gaming Laptop, NVIDIA RTX 5060, Intel Core 7 240H",
    45,
  );
  assert.equal(out.includes("…"), false);
  assert.ok(out.length <= 45);
});

test("sanitizeMetaCopy strips Amazon.com prefix", () => {
  assert.equal(
    sanitizeMetaCopy("Amazon.com: Cool Headphones with ANC"),
    "Cool Headphones with ANC",
  );
});
