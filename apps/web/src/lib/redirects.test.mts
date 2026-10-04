import assert from "node:assert/strict";
import test from "node:test";
import {
  apexToWwwTarget,
  crawlerAliasTarget,
  normalizeHost,
} from "./redirects.ts";

test("normalizeHost prefers x-forwarded-host and strips port", () => {
  assert.equal(normalizeHost("Dealstoker.com:443, proxy", "other"), "dealstoker.com");
  assert.equal(normalizeHost(null, "www.dealstoker.com"), "www.dealstoker.com");
  assert.equal(normalizeHost(undefined, undefined), "");
});

test("apex redirect keeps path and query", () => {
  assert.equal(
    apexToWwwTarget("dealstoker.com", "/c/electronics", "?sort=newest&page=1"),
    "https://www.dealstoker.com/c/electronics?sort=newest&page=1",
  );
  assert.equal(apexToWwwTarget("dealstoker.com", "/", ""), "https://www.dealstoker.com/");
});

test("www and previews are not redirected", () => {
  assert.equal(apexToWwwTarget("www.dealstoker.com", "/", ""), null);
  assert.equal(apexToWwwTarget("localhost", "/", ""), null);
});

test("bare /robots and /sitemap map to text endpoints", () => {
  assert.equal(
    crawlerAliasTarget("dealstoker.com", "https://dealstoker.com", "/robots", ""),
    "https://www.dealstoker.com/robots.txt",
  );
  assert.equal(
    crawlerAliasTarget("localhost", "http://localhost:3000", "/sitemap/", "?x=1"),
    "http://localhost:3000/sitemap.xml?x=1",
  );
  assert.equal(
    crawlerAliasTarget("www.dealstoker.com", "https://www.dealstoker.com", "/robots.txt", ""),
    null,
  );
});
