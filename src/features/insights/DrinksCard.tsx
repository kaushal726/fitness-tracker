import type { FoodLookup } from "../../data/selectors.ts";
import type { Entry } from "../../data/types.ts";
import { drinkSummary } from "../../domain/drinks.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatNumber } from "../../lib/format.ts";
import { ProgressBar } from "../../ui/ProgressBar";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./DrinksCard.module.css";

interface Props {
  month: MonthInsights;
  entries: Entry[];
  lookup: FoodLookup;
  ready: boolean;
}

/** About two litres of water a day, in glasses. */
const WATER_AIM_GLASSES = 8;

const oneDecimal = (n: number): string => (Math.round(n * 10) / 10).toLocaleString("en-IN");
const count = (n: number, one: string, many: string): string => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** Water against a glass count, chai and coffee a day with their calories, and the sweet and alcoholic drinks of the month. */
export function DrinksCard({ month, entries, lookup, ready }: Props) {
  const r = ready ? drinkSummary(entries, month.days, lookup) : null;
  return (
    <InsightCard label="Drinks" tag="Average day">
      {!ready ? (
        <p className={styles.empty}>Loading the food list…</p>
      ) : !r ? (
        <p className={styles.empty}>Drinks you log show here: water, chai, coffee, juice and the rest.</p>
      ) : (
        <ul className={styles.list}>
          <li>
            <div className={styles.line}>
              <span className={styles.name}>Water</span>
              <span className={styles.amount}>{oneDecimal(r.waterGlasses)} <small>of {WATER_AIM_GLASSES} glasses</small></span>
            </div>
            <ProgressBar value={r.waterGlasses} max={WATER_AIM_GLASSES} size="sm" label="Glasses of water against about two litres" />
          </li>
          <li className={styles.row}>
            <span className={styles.name}>Chai and coffee</span>
            <span className={styles.amount}>{oneDecimal(r.cups)} <small>cups, {formatNumber(r.cupCalories)} kcal</small></span>
          </li>
          <li className={styles.row}>
            <span className={styles.name}>Sweet drinks</span>
            <span className={styles.amount}>{count(r.sweetDrinks, "drink", "drinks")} <small>{formatNumber(r.sweetCalories)} kcal</small></span>
          </li>
          {r.alcoholDrinks > 0 && (
            <li className={styles.row}>
              <span className={styles.name}>Alcohol</span>
              <span className={styles.amount}>{count(r.alcoholDrinks, "drink", "drinks")} <small>{formatNumber(r.alcoholCalories)} kcal</small></span>
            </li>
          )}
        </ul>
      )}
    </InsightCard>
  );
}
