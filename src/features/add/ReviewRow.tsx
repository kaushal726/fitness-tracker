import type { Entry } from "../../data/types.ts";
import { defaultPortion } from "../../domain/portions.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { IconChevronDown } from "../../ui/icons";
import { AmountCard } from "./AmountCard.tsx";
import listStyles from "./FoodList.module.css";
import styles from "./ReviewRow.module.css";

interface Props {
  entry: Entry;
  /** Undefined when the food is gone (a custom food that was deleted): the entry can still be taken out. */
  food: Food | undefined;
  open: boolean;
  onToggle: () => void;
  onRevise: (choice: { quantity: number; unit: string; meal: MealType }) => void;
  onRemove: () => void;
}

/** One thing that was added: what and how much, and a card under it to change the amount or meal, or take it out. */
export function ReviewRow({ entry, food, open, onToggle, onRevise, onRemove }: Props) {
  return (
    <li className={cx(listStyles.row, open && listStyles.open)}>
      <button type="button" className={listStyles.main} aria-expanded={open} onClick={onToggle}>
        <span className={listStyles.text}>
          <span className={listStyles.name}><span className={listStyles.nameText}>{entry.name}</span></span>
          <span className={listStyles.meta}>{formatPortionText(entry.portionText)} · {MEAL_LABELS[entry.meal]}</span>
        </span>
        <span className={cx(styles.kcal, "num")}>{formatNumber(entry.nutrition.calories)}<small> kcal</small></span>
        <IconChevronDown className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden />
      </button>
      {open && (
        <div className={listStyles.panel}>
          {food ? (
            <AmountCard
              food={food}
              initial={defaultPortion(food, { quantity: entry.quantity, unit: entry.unit })}
              initialMeal={entry.meal}
              actionLabel="Save"
              onSubmit={({ quantity, unit, meal }) => onRevise({ quantity, unit, meal: meal ?? entry.meal })}
              onRemove={onRemove}
            />
          ) : (
            <div className={styles.missing}>
              <p>This food is no longer in your list, so its amount cannot be changed. You can still remove it.</p>
              <Button variant="danger" block onClick={onRemove}>Remove</Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
