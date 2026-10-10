import assert from "node:assert/strict";
import test from "node:test";
import { googleTagInitScript, googleTagSrc, isValidGoogleTagId } from "./google-tag.ts";

test("init script matches Google's snippet (single quotes, same lines)", () => {
  const script = googleTagInitScript("AW-18495871546");
  assert.ok(script.includes("window.dataLayer = window.dataLayer || [];"));
  assert.ok(script.includes("function gtag(){dataLayer.push(arguments);}"));
  assert.ok(script.includes("gtag('js', new Date());"));
  assert.ok(script.includes("gtag('config', 'AW-18495871546');"));
});

test("loader URL carries the tag ID", () => {
  assert.equal(
    googleTagSrc("AW-18495871546"),
    "https://www.googletagmanager.com/gtag/js?id=AW-18495871546",
  );
});

test("only real tag IDs are accepted, so nothing can break out of the script", () => {
  assert.ok(isValidGoogleTagId("AW-18495871546"));
  assert.ok(isValidGoogleTagId("G-ABC123XYZ"));
  assert.ok(!isValidGoogleTagId("AW-1');alert(1);//"));
  assert.ok(!isValidGoogleTagId(""));
  assert.throws(() => googleTagInitScript("AW-1'</script>"));
});

test("extra IDs (GA4) add config lines without changing the Ads snippet", () => {
  const single = googleTagInitScript("AW-18495871546");
  const both = googleTagInitScript("AW-18495871546", ["G-ABC123XYZ"]);
  assert.ok(both.startsWith(single));
  assert.ok(both.includes("gtag('config', 'G-ABC123XYZ');"));
  assert.throws(() => googleTagInitScript("AW-18495871546", ["G-1');alert(1);//"]));
});
