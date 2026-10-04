import { mealAverages } from "../../domain/breakdowns.ts";
import { MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import type { Entry } from "../../data/types.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { HBars, kcalText } from "./HBars.tsx";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./MealCard.module.css";

interface Props {
  month: MonthInsights;
  entries: Entry[];
}

/** Which meals carry the day: calories from each, on an average day. */
export function MealCard({ month, entries }: Props) {
  const averages = mealAverages(entries, month.days);
  const total = MEAL_ORDER.reduce((sum, m) => sum + averages[m], 0);

  return (
    <InsightCard label="By meal" tag="Average day">
      {total <= 0 ? (
        <p className={styles.empty}>Shows once a full day is logged.</p>
      ) : (
        <HBars
          title="Calories from each meal on an average day"
          rows={MEAL_ORDER.map((m) => ({ key: m, label: MEAL_LABELS[m], value: averages[m], text: kcalText(averages[m]), hint: `${Math.round((averages[m] / total) * 100)}%` }))}
        />
      )}
    </InsightCard>
  );
}
