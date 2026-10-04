import { currentStreak, longestStreak } from "../../domain/breakdowns.ts";
import type { Entry } from "../../data/types.ts";
import { weekdayIndex } from "../../domain/month.ts";
import { isCounted, OVER_DAY_SHARE, type DayStat, type MonthInsights } from "../../domain/monthInsights.ts";
import { cx } from "../../lib/cx.ts";
import { parseISODate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { InsightCard } from "./InsightCard.tsx";
import { Legend } from "./Legend.tsx";
import styles from "./ConsistencyCard.module.css";

interface Props {
  month: MonthInsights;
  entries: Entry[];
  today: string;
}

const INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

function statusOf(d: DayStat, goal: number): "over" | "ok" | "partial" | "today" | "missed" | "future" {
  if (d.phase === "today") return "today";
  if (d.phase === "future") return "future";
  if (!d.logged) return "missed";
  if (d.partial) return "partial";
  return isCounted(d) && d.totals.calories > goal * OVER_DAY_SHARE ? "over" : "ok";
}

/** The month as a calendar: which days were logged, which ran over, and how long the run of logged days is. */
export function ConsistencyCard({ month, entries, today }: Props) {
  const elapsed = month.days.filter((d) => d.phase !== "future").length;
  const loggedDates = new Set(entries.map((e) => e.date));
  const first = month.days[0];
  const lead = first ? weekdayIndex(first.date) : 0;
  const streak = month.phase === "current" ? currentStreak(loggedDates, today) : null;

  return (
    <InsightCard label="Consistency" tag={`${month.loggedDays} of ${elapsed} days logged`}>
      <dl className={styles.stats}>
        {streak !== null && (
          <div>
            <dt>Streak</dt>
            <dd>{streak}<small> {streak === 1 ? "day" : "days"}</small></dd>
          </div>
        )}
        <div>
          <dt>Best run</dt>
          <dd>{longestStreak(month.days)}<small> days</small></dd>
        </div>
        <div>
          <dt>Over goal</dt>
          <dd>{month.overDays}<small> {month.overDays === 1 ? "day" : "days"}</small></dd>
        </div>
      </dl>

      <div className={styles.calendar} role="grid" aria-label="Days of the month">
        {INITIALS.map((initial, i) => <span key={i} className={styles.weekday} role="columnheader">{initial}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`gap${i}`} aria-hidden />)}
        {month.days.map((d) => {
          const status = statusOf(d, month.goal);
          const date = parseISODate(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
          return (
            <span key={d.date} className={cx(styles.day, styles[status])} role="gridcell" aria-label={d.logged ? `${date}: ${formatNumber(d.totals.calories)} kcal` : `${date}: nothing logged`} title={d.logged ? `${date}: ${formatNumber(d.totals.calories)} kcal` : date}>
              {d.day}
            </span>
          );
        })}
      </div>
      <Legend items={[{ label: "Within goal", swatch: "box", tone: "primary" }, { label: "Over", swatch: "box", tone: "over" }, { label: "Not logged", swatch: "box", tone: "muted" }]} />
    </InsightCard>
  );
}
