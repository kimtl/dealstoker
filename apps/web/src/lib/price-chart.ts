/**
 * Geometry for the small price-history chart on product pages. Pure functions (no React)
 * so they can be unit tested. Prices are drawn as a step line: a price holds until the
 * next day we recorded a different one, which is how Amazon prices actually behave.
 */

export type ChartPoint = { date: string; price: number };

export type ChartGeometry = {
  /** Step line through every recorded price, continued to the right edge. */
  line: string;
  /** Same line closed down to the bottom edge, for a soft fill. */
  area: string;
  /** Last recorded point (for a dot). */
  last: { x: number; y: number };
  /** Lowest price point (for a dot), or null when the price never moved. */
  low: { x: number; y: number } | null;
  minPrice: number;
  maxPrice: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(isoDate: string): number {
  return Math.round(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
}

const round = (value: number) => Math.round(value * 10) / 10;

export function buildPriceChart(
  points: ChartPoint[],
  width: number,
  height: number,
  padding = 6,
): ChartGeometry | null {
  const valid = points
    .filter((p) => Number.isFinite(p.price) && !Number.isNaN(dayNumber(p.date)))
    .sort((a, b) => dayNumber(a.date) - dayNumber(b.date));
  if (valid.length === 0) return null;

  const firstDay = dayNumber(valid[0].date);
  const lastDay = dayNumber(valid[valid.length - 1].date);
  const span = Math.max(1, lastDay - firstDay);
  const prices = valid.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Flat history sits in the middle instead of on the floor.
  const range = maxPrice - minPrice || Math.max(1, maxPrice * 0.1);
  const floor = maxPrice === minPrice ? minPrice - range / 2 : minPrice;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const x = (date: string) =>
    valid.length === 1 ? padding : padding + ((dayNumber(date) - firstDay) / span) * innerW;
  const y = (price: number) => padding + innerH - ((price - floor) / range) * innerH;

  let line = `M${round(x(valid[0].date))} ${round(y(valid[0].price))}`;
  for (let i = 1; i < valid.length; i++) {
    line += ` H${round(x(valid[i].date))} V${round(y(valid[i].price))}`;
  }
  const right = width - padding;
  line += ` H${round(right)}`;
  const bottom = height - padding;
  const area = `${line} V${round(bottom)} H${round(x(valid[0].date))} Z`;

  const lastPoint = valid[valid.length - 1];
  let low: ChartGeometry["low"] = null;
  if (maxPrice > minPrice) {
    // Most recent day at the lowest price.
    const lowPoint = [...valid].reverse().find((p) => p.price === minPrice)!;
    low = { x: round(x(lowPoint.date)), y: round(y(lowPoint.price)) };
  }
  return {
    line,
    area,
    last: { x: round(right), y: round(y(lastPoint.price)) },
    low,
    minPrice,
    maxPrice,
  };
}
