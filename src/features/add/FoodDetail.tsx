import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LastUsed } from "../../data/types.ts";
import { hasFinePointer } from "../../lib/device.ts";
import { formatNumber } from "../../lib/format.ts";
import { scrollParent } from "../../lib/scroll.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconTrash } from "../../ui/icons";
import { SectionLabel } from "../../ui/SectionLabel";
import { MealChips } from "./MealChips.tsx";
import { NutritionLine } from "./NutritionLine.tsx";
import { QuantityControl } from "./QuantityControl.tsx";
import { usePortion } from "./usePortion.ts";
import styles from "./FoodDetail.module.css";

export interface PortionChoice {
  quantity: number;
  unit: string;
  /** Only when the meal was offered as a choice. */
  meal?: MealType;
}

interface Props {
  food: Food;
  initial: LastUsed;
  /** The button's words, before the calories. */
  actionLabel: string;
  onSubmit: (choice: PortionChoice) => void;
  /** Given when changing something already logged: its meal can change too, and it can be taken out. */
  edit?: { meal: MealType; onRemove: () => void };
}

/**
 * The one question left once a food is picked: how much. The amount, what it comes to, and one button.
 * It fills the page it is on, so it never needs a sheet of its own.
 */
export function FoodDetail({ food, initial, actionLabel, onSubmit, edit }: Props) {
  const portion = usePortion(food, initial);
  const [meal, setMeal] = useState(edit?.meal);
  const top = useRef<HTMLFormElement>(null);
  const { nutrition } = portion;
  const approximate = food.nutritionConfidence === "low" || food.variability === "high";

  // Arrives at its top, whatever the list it was opened from was scrolled to.
  useEffect(() => {
    scrollParent(top.current)?.scrollTo({ top: 0 });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (nutrition) onSubmit({ quantity: portion.quantity, unit: portion.unit, meal });
  };

  return (
    <form ref={top} className={styles.detail} onSubmit={submit} aria-label={`Amount of ${food.name}`}>
      <div className={styles.content}>
        <QuantityControl
          autoFocus={hasFinePointer()}
          food={food}
          quantityText={portion.quantityText}
          unit={portion.unit}
          onQuantityText={portion.setQuantityText}
          onUnit={portion.setUnit}
        />
        <NutritionLine nutrition={nutrition} approximate={approximate} />
        {meal && (
          <div>
            <SectionLabel>Meal</SectionLabel>
            <MealChips value={meal} onChange={setMeal} />
          </div>
        )}
      </div>
      <div className={styles.bar}>
        {edit && <IconButton label="Remove" icon={<IconTrash />} variant="danger" onClick={edit.onRemove} />}
        <Button type="submit" variant="primary" size="lg" block disabled={!nutrition}>
          {actionLabel}{nutrition ? ` · ${formatNumber(nutrition.calories)} kcal` : ""}
        </Button>
      </div>
    </form>
  );
}
