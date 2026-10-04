import type { Entry } from "../../data/types.ts";
import { highlights } from "../../domain/highlights.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatDate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./HighlightsCard.module.css";

interface Props {
  month: MonthInsights;
  entries: Entry[];
}

const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/** A few plain facts: the heaviest and lightest days, the best protein day, the favourite food, and how varied it was. */
export function HighlightsCard({ month, entries }: Props) {
  const h = highlights(entries, month.days, month.month);
  const rows: { key: string; label: string; value: string; hint?: string }[] = [];
  if (h.heaviest) rows.push({ key: "heavy", label: "Heaviest day", value: `${formatNumber(h.heaviest.calories)} kcal`, hint: formatDate(h.heaviest.date, SHORT_DAY) });
  if (h.lightest && h.lightest.date !== h.heaviest?.date) rows.push({ key: "light", label: "Lightest day", value: `${formatNumber(h.lightest.calories)} kcal`, hint: formatDate(h.lightest.date, SHORT_DAY) });
  if (h.topProtein) rows.push({ key: "protein", label: "Best protein day", value: `${formatNumber(h.topProtein.protein)} g`, hint: formatDate(h.topProtein.date, SHORT_DAY) });
  if (h.mostLogged) rows.push({ key: "fav", label: "Most eaten", value: h.mostLogged.name, hint: `${h.mostLogged.times} ${h.mostLogged.times === 1 ? "time" : "times"}` });
  if (h.foodsEaten > 0) rows.push({ key: "variety", label: "Different foods", value: formatNumber(h.foodsEaten), hint: h.newFoods > 0 ? `${formatNumber(h.newFoods)} new this month` : undefined });

  return (
    <InsightCard label="Highlights" tag="This month">
      {rows.length === 0 ? (
        <p className={styles.empty}>Shows once a full day is logged.</p>
      ) : (
        <dl className={styles.list}>
          {rows.map((r) => (
            <div key={r.key} className={styles.row}>
              <dt>{r.label}</dt>
              <dd>
                <span className={styles.value}>{r.value}</span>
                {r.hint && <small>{r.hint}</small>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </InsightCard>
  );
}
