import { MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Chip } from "../../ui/Chip";
import styles from "./MealChips.module.css";

interface Props {
  value: MealType;
  onChange: (meal: MealType) => void;
}

/** One-of-four choice of meal, all four in view at once. */
export function MealChips({ value, onChange }: Props) {
  return (
    <div className={styles.meals} role="radiogroup" aria-label="Meal">
      {MEAL_ORDER.map((m) => <Chip key={m} role="radio" selected={value === m} onClick={() => onChange(m)}>{MEAL_LABELS[m]}</Chip>)}
    </div>
  );
}
