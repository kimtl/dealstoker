import assert from "node:assert/strict";
import test from "node:test";
import {
  detectLocale,
  localizedAbsoluteUrl,
  withLocaleQuery,
} from "./i18n/locale.ts";

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

test("hl query overrides cookie and Accept-Language", () => {
  assert.equal(detectLocale("en-US", "en", "ko"), "ko");
  assert.equal(detectLocale("ko-KR", "ko", "en"), "en");
  assert.equal(detectLocale(null, null, "ko"), "ko");
});

test("localizedAbsoluteUrl adds hl only for Korean", () => {
  assert.equal(
    localizedAbsoluteUrl("https://www.dealstoker.com", "/", "en"),
    "https://www.dealstoker.com/",
  );
  assert.equal(
    localizedAbsoluteUrl("https://www.dealstoker.com", "/", "ko"),
    "https://www.dealstoker.com/?hl=ko",
  );
  assert.equal(
    localizedAbsoluteUrl("https://www.dealstoker.com", "/c/electronics", "ko"),
    "https://www.dealstoker.com/c/electronics?hl=ko",
  );
  assert.equal(
    localizedAbsoluteUrl(
      "https://www.dealstoker.com",
      "/search?q=air+fryer",
      "ko",
    ),
    "https://www.dealstoker.com/search?q=air+fryer&hl=ko",
  );
});

test("withLocaleQuery preserves other params", () => {
  assert.equal(withLocaleQuery("/search", "q=ninja", "ko"), "/search?q=ninja&hl=ko");
  assert.equal(withLocaleQuery("/search", "q=ninja&hl=ko", "en"), "/search?q=ninja");
  assert.equal(withLocaleQuery("/", "", "ko"), "/?hl=ko");
  assert.equal(withLocaleQuery("/", "hl=ko", "en"), "/");
});
