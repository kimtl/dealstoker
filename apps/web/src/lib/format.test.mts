import assert from "node:assert/strict";
import test from "node:test";
import { discountPercentOf, formatUpdatedAt, isPriceStale, siteTimeZoneAbbr } from "./format.ts";

test("formatUpdatedAt shows US Eastern daylight time in summer", () => {
  // 02:10 UTC on Oct 7 is still Oct 6 in New York (UTC-4).
  assert.equal(formatUpdatedAt("2026-10-07T02:10:00Z", "en"), "Oct 6, 2026, 10:10 PM EDT");
});

test("formatUpdatedAt switches to EST in winter", () => {
  assert.equal(formatUpdatedAt("2026-12-01T17:05:00Z", "en"), "Dec 1, 2026, 12:05 PM EST");
});

test("formatUpdatedAt uses the EDT/EST label in Korean too", () => {
  assert.equal(formatUpdatedAt("2026-10-07T02:10:00Z", "ko"), "2026년 10월 6일 오후 10:10 EDT");
});

test("formatUpdatedAt handles empty and invalid input", () => {
  assert.equal(formatUpdatedAt(null), null);
  assert.equal(formatUpdatedAt("not a date"), null);
});

test("siteTimeZoneAbbr follows daylight saving", () => {
  assert.equal(siteTimeZoneAbbr(new Date("2026-07-01T12:00:00Z")), "EDT");
  assert.equal(siteTimeZoneAbbr(new Date("2026-01-15T12:00:00Z")), "EST");
});

test("isPriceStale flags prices older than 36 hours or missing", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  assert.equal(isPriceStale("2026-10-08T00:00:00Z", now), false);
  assert.equal(isPriceStale("2026-10-07T01:00:00Z", now), false);
  assert.equal(isPriceStale("2026-10-06T23:00:00Z", now), true);
  assert.equal(isPriceStale(null, now), true);
  assert.equal(isPriceStale("garbage", now), true);
});

test("discountPercentOf rounds the saving vs. list price", () => {
  assert.equal(discountPercentOf({ priceAmount: 119.99, listPrice: 173.99 }), 31);
  assert.equal(discountPercentOf({ priceAmount: "34.99", listPrice: "50.74" }), 31);
  assert.equal(discountPercentOf({ priceAmount: 50, listPrice: 50 }), null);
  assert.equal(discountPercentOf({ priceAmount: 60, listPrice: 50 }), null);
  assert.equal(discountPercentOf({ priceAmount: 10, listPrice: null }), null);
  assert.equal(discountPercentOf(null), null);
});
