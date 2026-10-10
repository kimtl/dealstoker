import assert from "node:assert/strict";
import test from "node:test";
import { buildPriceChart } from "./price-chart.ts";

test("empty history draws nothing", () => {
  assert.equal(buildPriceChart([], 300, 80), null);
});

test("step line spans the chart and uses day positions", () => {
  const chart = buildPriceChart(
    [
      { date: "2026-10-01", price: 50 },
      { date: "2026-10-03", price: 40 },
      { date: "2026-10-05", price: 45 },
    ],
    100,
    50,
    0,
  )!;
  // Oct 1 -> x 0, Oct 3 -> x 50, Oct 5 -> x 100; 50 at top, 40 at bottom.
  assert.equal(chart.line, "M0 0 H50 V50 H100 V25 H100");
  assert.deepEqual(chart.low, { x: 50, y: 50 });
  assert.deepEqual(chart.last, { x: 100, y: 25 });
  assert.equal(chart.minPrice, 40);
  assert.equal(chart.maxPrice, 50);
  assert.ok(chart.area.endsWith("V50 H0 Z"));
});

test("flat or single-point history sits mid-height with no low marker", () => {
  const chart = buildPriceChart([{ date: "2026-10-01", price: 30 }], 100, 50, 0)!;
  assert.equal(chart.low, null);
  assert.equal(chart.last.y, 25);
});

test("points out of order are sorted by date", () => {
  const chart = buildPriceChart(
    [
      { date: "2026-10-05", price: 45 },
      { date: "2026-10-01", price: 50 },
    ],
    100,
    50,
    0,
  )!;
  assert.ok(chart.line.startsWith("M0 0"));
});
