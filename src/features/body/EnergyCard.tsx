import { formatNumber } from "../../lib/format.ts";
import { HBars, kcalText, type HBar } from "../insights/HBars.tsx";
import { InsightCard } from "../insights/InsightCard.tsx";
import type { BodyView } from "./useBodyProgress.ts";
import styles from "./EnergyCard.module.css";

/** Within this many kcal a day, eating is level with what the body uses. */
const LEVEL_KCAL = 25;

/** What the body uses, what the plan asks, and what is eaten: three lengths to compare. */
export function EnergyCard({ view }: { view: BodyView }) {
  const { plan, progress: p } = view;
  const rows: HBar[] = [
    { key: "uses", label: "Your body uses", hint: `resting ${formatNumber(plan.bmr)}`, value: plan.tdee, text: kcalText(plan.tdee) },
    { key: "plan", label: "Your plan", value: plan.targets.calories, text: kcalText(plan.targets.calories) },
    ...(p.avgEaten === null ? [] : [{ key: "eat", label: "You eat", hint: "on average", value: p.avgEaten, text: kcalText(p.avgEaten) }]),
  ];
  const gap = p.avgNetKcal;

  return (
    <InsightCard label="Energy" tag="A day">
      <HBars title="Calories a day: what the body uses, the plan, and what is eaten" rows={rows} />
      <p className={styles.line}>
        {gap === null
          ? "Your average shows once a few days are logged."
          : Math.abs(gap) < LEVEL_KCAL
            ? "You eat about what your body uses."
            : `You eat about ${formatNumber(Math.abs(gap))} kcal ${gap < 0 ? "less" : "more"} than your body uses, every day.`}
      </p>
    </InsightCard>
  );
}
