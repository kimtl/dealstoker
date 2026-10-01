import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeSiteUrl, SITE_CANONICAL_URL } from "./site.ts";

test("apex becomes www canonical", () => {
  assert.equal(canonicalizeSiteUrl("https://dealstoker.com"), SITE_CANONICAL_URL);
  assert.equal(canonicalizeSiteUrl("https://dealstoker.com/"), SITE_CANONICAL_URL);
  assert.equal(canonicalizeSiteUrl("http://dealstoker.com"), SITE_CANONICAL_URL);
});

test("www stays www", () => {
  assert.equal(canonicalizeSiteUrl("https://www.dealstoker.com"), SITE_CANONICAL_URL);
  assert.equal(canonicalizeSiteUrl("https://www.dealstoker.com/"), SITE_CANONICAL_URL);
});

test("localhost and railway preview unchanged", () => {
  assert.equal(canonicalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");
  assert.equal(
    canonicalizeSiteUrl("https://dealstoker-web.up.railway.app"),
    "https://dealstoker-web.up.railway.app",
  );
});
