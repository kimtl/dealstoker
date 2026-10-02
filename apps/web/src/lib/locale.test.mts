import assert from "node:assert/strict";
import test from "node:test";
import { detectLocale } from "./i18n/locale.ts";

test("cookie overrides Accept-Language", () => {
  assert.equal(detectLocale("ko-KR,ko;q=0.9", "en"), "en");
  assert.equal(detectLocale("en-US,en;q=0.9", "ko"), "ko");
});

test("Accept-Language ko maps to Korean", () => {
  assert.equal(detectLocale("ko", null), "ko");
  assert.equal(detectLocale("ko-KR", undefined), "ko");
  assert.equal(detectLocale("ko-KR,ko;q=0.9,en-US;q=0.8", null), "ko");
});

test("non-Korean Accept-Language defaults to English", () => {
  assert.equal(detectLocale("en-US,en;q=0.9", null), "en");
  assert.equal(detectLocale("ja,en;q=0.8", null), "en");
  assert.equal(detectLocale(null, null), "en");
  assert.equal(detectLocale("", undefined), "en");
});

test("invalid cookie falls through to Accept-Language", () => {
  assert.equal(detectLocale("ko-KR", "fr"), "ko");
  assert.equal(detectLocale("en-US", "xx"), "en");
});
