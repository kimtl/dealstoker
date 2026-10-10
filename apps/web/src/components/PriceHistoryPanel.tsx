import { formatCalendarDate, formatMoney } from "@/lib/format";
import { formatMessage, type Locale, type Messages } from "@/lib/i18n";
import { buildPriceChart } from "@/lib/price-chart";
import { SITE_NAME } from "@/lib/site";
import type { PriceHistory, PriceVerdict } from "@/lib/types";
import styles from "./PriceHistoryPanel.module.css";

const CHART_W = 320;
const CHART_H = 96;

const TONE: Record<PriceVerdict, string> = {
  LOWEST: styles.good,
  BELOW_TYPICAL: styles.good,
  TYPICAL: styles.neutral,
  STEADY: styles.neutral,
  ABOVE_TYPICAL: styles.warn,
  TRACKING: styles.neutral,
};

function headline(history: PriceHistory, t: Messages, locale: Locale): string {
  const days = String(history.windowDays);
  switch (history.verdict) {
    case "LOWEST":
      return formatMessage(t.verdictLowest, { days });
    case "BELOW_TYPICAL":
      return t.verdictBelow;
    case "TYPICAL":
      return t.verdictTypical;
    case "ABOVE_TYPICAL":
      return t.verdictAbove;
    case "STEADY":
      return formatMessage(t.verdictSteady, { days });
    default:
      return formatMessage(t.verdictTracking, {
        date: formatCalendarDate(history.trackedSince, locale) ?? "",
      });
  }
}

/**
 * "Is this a good price?" box on product pages: a verdict, the usual/low/high prices and a
 * small step chart, all from prices DealStoker itself recorded.
 */
export function PriceHistoryPanel({
  history,
  locale,
  t,
}: {
  history: PriceHistory;
  locale: Locale;
  t: Messages;
}) {
  if (history.points.length === 0 || !history.trackedSince) return null;
  const chart = buildPriceChart(history.points, CHART_W, CHART_H);
  const money = (value: number | null) => formatMoney(value, history.currency, locale);
  const tracking = history.verdict === "TRACKING";
  const from = formatCalendarDate(history.points[0].date, locale) ?? "";
  const to = formatCalendarDate(history.points[history.points.length - 1].date, locale) ?? "";

  return (
    <section className={`${styles.panel} ${TONE[history.verdict]}`} aria-labelledby="price-history-title">
      <h2 id="price-history-title" className={styles.title}>
        {t.priceHistoryTitle}
      </h2>
      <p className={styles.verdict}>{headline(history, t, locale)}</p>
      {tracking ? (
        <p className={styles.detail}>{t.verdictTrackingDetail}</p>
      ) : (
        <>
          {history.verdict === "LOWEST" || history.verdict === "STEADY" ? null : (
            <p className={styles.detail}>
              {formatMessage(t.priceRangeDetail, { days: String(history.windowDays) })}
            </p>
          )}
          <dl className={styles.stats}>
            <div>
              <dt>{t.priceUsual}</dt>
              <dd>{money(history.typical)}</dd>
            </div>
            <div>
              <dt>{t.priceLow}</dt>
              <dd>{money(history.lowest)}</dd>
            </div>
            <div>
              <dt>{t.priceHigh}</dt>
              <dd>{money(history.highest)}</dd>
            </div>
          </dl>
        </>
      )}
      {chart && history.points.length > 1 ? (
        <figure className={styles.chart}>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            role="img"
            aria-label={formatMessage(t.priceChartLabel, { from, to })}
            preserveAspectRatio="none"
          >
            <path d={chart.area} className={styles.area} />
            <path d={chart.line} className={styles.line} vectorEffect="non-scaling-stroke" />
            {chart.low ? <circle cx={chart.low.x} cy={chart.low.y} r={3} className={styles.lowDot} /> : null}
            <circle cx={chart.last.x} cy={chart.last.y} r={3} className={styles.lastDot} />
          </svg>
          <figcaption className={styles.axis}>
            <span>{from}</span>
            <span>
              {money(chart.minPrice)} – {money(chart.maxPrice)}
            </span>
            <span>{to}</span>
          </figcaption>
        </figure>
      ) : null}
      <p className={styles.source}>{formatMessage(t.priceHistorySource, { site: SITE_NAME })}</p>
    </section>
  );
}
