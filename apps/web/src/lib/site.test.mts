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

test("Google Ads ID: unset or empty falls back to the default", async () => {
  const { resolveGoogleAdsId, DEFAULT_GOOGLE_ADS_ID } = await import("./site.ts");
  assert.equal(resolveGoogleAdsId(undefined), DEFAULT_GOOGLE_ADS_ID);
  assert.equal(resolveGoogleAdsId(""), DEFAULT_GOOGLE_ADS_ID);
  assert.equal(resolveGoogleAdsId("   "), DEFAULT_GOOGLE_ADS_ID);
});

test("Google Ads ID: explicit value wins, 'off' disables", async () => {
  const { resolveGoogleAdsId } = await import("./site.ts");
  assert.equal(resolveGoogleAdsId("AW-123"), "AW-123");
  assert.equal(resolveGoogleAdsId("off"), "");
  assert.equal(resolveGoogleAdsId("NONE"), "");
});
