import type { Targets } from "../../data/types.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { ProgressBar, type BarTone } from "../../ui/ProgressBar";
import { Ring } from "../../ui/Ring";
import styles from "./CalorieHero.module.css";

interface Props {
  totals: NutritionTotals;
  targets: Targets;
}

const MACROS: { key: "protein" | "carbs" | "fat" | "fiber"; label: string; tone: BarTone }[] = [
  { key: "protein", label: "Protein", tone: "protein" },
  { key: "carbs", label: "Carbs", tone: "carbs" },
  { key: "fat", label: "Fat", tone: "fat" },
  { key: "fiber", label: "Fiber", tone: "fiber" },
];

/** Calories first, in a ring; then the four macros, quietly, in one row. */
export function CalorieHero({ totals, targets }: Props) {
  const left = targets.calories - totals.calories;
  const over = left < 0;
  return (
    <Card tone="hero" className={styles.hero}>
      <div className={styles.top}>
        <Ring value={totals.calories} max={targets.calories} tone={over ? "over" : "primary"} label={`${formatNumber(totals.calories)} of ${formatNumber(targets.calories)} calories eaten`}>
          <span className={cx(styles.leftValue, over && styles.overValue, "num")}><CountUp value={Math.abs(left)} /></span>
          <span className={styles.leftLabel}>{over ? "kcal over" : "kcal left"}</span>
        </Ring>
        <dl className={styles.figures}>
          <div>
            <dt>Eaten</dt>
            <dd className="num"><CountUp value={totals.calories} /></dd>
          </div>
          <div>
            <dt>Goal</dt>
            <dd className="num">{formatNumber(targets.calories)}</dd>
          </div>
        </dl>
      </div>

      <ul className={styles.macros}>
        {MACROS.map(({ key, label, tone }) => (
          <li key={key}>
            <span className={cx(styles.macroLabel, styles[tone])}>{label}</span>
            <span className={cx(styles.macroValue, "num")}>{formatNumber(totals[key])}<small> / {formatNumber(targets[key])} g</small></span>
            <ProgressBar value={totals[key]} max={targets[key]} tone={tone} size="sm" label={`${label} eaten`} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
