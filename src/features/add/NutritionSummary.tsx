import { cx } from "../../lib/cx.ts";
import { formatNumber, formatQuantity } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { CountUp } from "../../ui/CountUp";
import { IconChevronDown, IconFlame, IconInfo } from "../../ui/icons";
import styles from "./NutritionSummary.module.css";

interface Props {
  /** Null while the quantity is not a usable number. */
  nutrition: NutritionTotals | null;
  approximate: boolean;
}

const PILLS = [
  { key: "protein", label: "Protein", tone: styles.protein },
  { key: "carbs", label: "Carbs", tone: styles.carbs },
  { key: "fat", label: "Fat", tone: styles.fat },
  { key: "fiber", label: "Fiber", tone: styles.fiber },
] as const;

const KCAL_COUNT_MS = 350;

/** Calories large, the other four numbers small, everything else one tap away. */
export function NutritionSummary({ nutrition, approximate }: Props) {
  return (
    <section aria-live="polite">
      <div className={styles.hero}>
        <IconFlame className={styles.flame} aria-hidden />
        <span className={cx(styles.kcal, "num")}>{nutrition ? <CountUp value={nutrition.calories} duration={KCAL_COUNT_MS} /> : "–"}</span>
        <span className={styles.unit}>kcal</span>
      </div>

      <ul className={styles.pills}>
        {PILLS.map(({ key, label, tone }) => (
          <li key={key} className={tone}>
            <span className={styles.pillLabel}>{label}</span>
            <span className={cx(styles.pillValue, "num")}>{nutrition ? `${formatQuantity(nutrition[key])} g` : "–"}</span>
          </li>
        ))}
      </ul>

      <details className={styles.more}>
        <summary>More nutrition <IconChevronDown aria-hidden /></summary>
        <dl>
          <dt>Sugar</dt><dd className="num">{nutrition ? `${formatQuantity(nutrition.sugar)} g` : "–"}</dd>
          <dt>Sodium</dt><dd className="num">{nutrition ? `${formatNumber(nutrition.sodium)} mg` : "–"}</dd>
        </dl>
      </details>

      {approximate && (
        <p className={styles.approx}>
          <IconInfo aria-hidden />
          Approximate. This varies with the recipe and the portion.
        </p>
      )}
    </section>
  );
}
