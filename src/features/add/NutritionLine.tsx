import { formatQuantity } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { CountUp } from "../../ui/CountUp";
import { IconInfo } from "../../ui/icons";
import styles from "./NutritionLine.module.css";

interface Props {
  /** Null while the quantity is not a usable number. */
  nutrition: NutritionTotals | null;
  approximate: boolean;
}

const MACROS = [
  { key: "protein", label: "Protein", tone: styles.protein },
  { key: "carbs", label: "Carbs", tone: styles.carbs },
  { key: "fat", label: "Fat", tone: styles.fat },
  { key: "fiber", label: "Fiber", tone: styles.fiber },
] as const;

const KCAL_COUNT_MS = 300;

/** What the amount comes to, kept quiet: the calories, and the four macros in one row under them. */
export function NutritionLine({ nutrition, approximate }: Props) {
  return (
    <section className={styles.line} aria-label="Nutrition" aria-live="polite">
      <p className={styles.kcal}>
        <span className="num">{nutrition ? <CountUp value={nutrition.calories} duration={KCAL_COUNT_MS} /> : "–"}</span>
        <small>kcal</small>
      </p>
      <ul className={styles.macros}>
        {MACROS.map(({ key, label, tone }) => (
          <li key={key} className={tone}>
            <span className={styles.label}><span className={styles.dot} aria-hidden />{label}</span>
            <span className={`${styles.value} num`}>{nutrition ? `${formatQuantity(nutrition[key])} g` : "–"}</span>
          </li>
        ))}
      </ul>
      {approximate && (
        <p className={styles.approx}>
          <IconInfo aria-hidden />
          Approximate. This varies with the recipe and the portion.
        </p>
      )}
    </section>
  );
}
