import { useState, type FormEvent } from "react";
import type { LastUsed } from "../../data/types.ts";
import { toggleFavorite, useAppState } from "../../data/store.ts";
import { cx } from "../../lib/cx.ts";
import { hasFinePointer } from "../../lib/device.ts";
import { formatNumber } from "../../lib/format.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconStar, IconTrash } from "../../ui/icons";
import { MealChips } from "./MealChips.tsx";
import { NutritionLine } from "./NutritionLine.tsx";
import { QuantityControl } from "./QuantityControl.tsx";
import { usePortion } from "./usePortion.ts";
import styles from "./AmountCard.module.css";

export interface PortionChoice {
  quantity: number;
  unit: string;
  /** Only when the card offered a meal to choose. */
  meal?: MealType;
}

interface Props {
  food: Food;
  initial: LastUsed;
  /** Give it to offer the meal as a choice too (when changing what was logged). */
  initialMeal?: MealType;
  /** What the main button says, before the calories. */
  actionLabel: string;
  onSubmit: (choice: PortionChoice) => void;
  /** Given when the card is for something already logged: it offers to take it out. */
  onRemove?: () => void;
}

/**
 * How much of a food, right where the food is: the amount, what it comes to, and the one button that logs it.
 * It opens inside a list, so choosing an amount never needs a second sheet.
 */
export function AmountCard({ food, initial, initialMeal, actionLabel, onSubmit, onRemove }: Props) {
  const { favorites } = useAppState();
  const portion = usePortion(food, initial);
  const [meal, setMeal] = useState(initialMeal);
  const isFavorite = favorites.includes(food.id);
  const approximate = food.nutritionConfidence === "low" || food.variability === "high";
  const { nutrition } = portion;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (nutrition) onSubmit({ quantity: portion.quantity, unit: portion.unit, meal });
  };

  return (
    <form className={styles.card} onSubmit={submit} aria-label={`Amount of ${food.name}`}>
      <QuantityControl
        compact
        autoFocus={hasFinePointer()}
        food={food}
        quantityText={portion.quantityText}
        unit={portion.unit}
        onQuantityText={portion.setQuantityText}
        onUnit={portion.setUnit}
      />
      <NutritionLine nutrition={nutrition} approximate={approximate} />
      {meal && <MealChips value={meal} onChange={setMeal} />}
      <div className={styles.actions}>
        {onRemove ? (
          <IconButton label="Remove" icon={<IconTrash />} variant="danger" onClick={onRemove} />
        ) : (
          <IconButton
            label={isFavorite ? "Remove from favourites" : "Add to favourites"}
            icon={<IconStar className={cx(isFavorite && styles.starOn)} />}
            aria-pressed={isFavorite}
            onClick={() => toggleFavorite(food.id)}
          />
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={!nutrition}>
          {actionLabel}{nutrition ? ` · ${formatNumber(nutrition.calories)} kcal` : ""}
        </Button>
      </div>
    </form>
  );
}
