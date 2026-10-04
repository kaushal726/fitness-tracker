import { topFoods } from "../../domain/breakdowns.ts";
import type { Entry } from "../../data/types.ts";
import type { MonthId } from "../../domain/month.ts";
import { HBars, kcalText } from "./HBars.tsx";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./FoodsCard.module.css";

interface Props {
  entries: Entry[];
  month: MonthId;
}

const LIMIT = 5;

/** What the calories were spent on: the foods that supplied the most of them this month. */
export function FoodsCard({ entries, month }: Props) {
  const foods = topFoods(entries, month, LIMIT);
  return (
    <InsightCard label="Top foods" tag="By calories">
      {foods.length === 0 ? (
        <p className={styles.empty}>The foods you eat most show here.</p>
      ) : (
        <HBars title="Foods that supplied the most calories" rows={foods.map((f) => ({ key: f.foodId, label: f.name, value: f.calories, text: kcalText(f.calories), hint: `${f.times} ${f.times === 1 ? "time" : "times"}` }))} />
      )}
    </InsightCard>
  );
}
