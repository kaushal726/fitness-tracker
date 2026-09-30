import { useState } from "react";
import { toggleFavorite, useAppState } from "../../data/store.ts";
import type { LastUsed } from "../../data/types.ts";
import { MEAL_LABELS, MEAL_ORDER, mealForTime } from "../../domain/meals.ts";
import { formatNumber, formatQuantity, parseNumber } from "../../lib/format.ts";
import { categoryLabel } from "../../nutrition/categories.ts";
import { nutritionForFood } from "../../nutrition/calculate.ts";
import type { Food, MealType, NutritionTotals } from "../../nutrition/types.ts";
import { Button, IconButton } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { IconStar, IconTrash } from "../../ui/icons";
import { SectionLabel } from "../../ui/SectionLabel";
import { Sheet } from "../../ui/Sheet";
import { cx } from "../../lib/cx.ts";
import type { LogChoice } from "./useLogFood.ts";
import { NutritionSummary } from "./NutritionSummary.tsx";
import { QuantityControl } from "./QuantityControl.tsx";
import styles from "./PortionSheet.module.css";

interface Props {
  mode: "add" | "edit";
  food: Food;
  initial: LastUsed;
  /** Null means automatic; edits pass the entry's own meal. */
  initialMeal: MealType | null;
  onClose: () => void;
  onConfirm: (choice: LogChoice) => void;
  onDelete?: () => void;
}

function safeNutrition(food: Food, quantity: number, unit: string): NutritionTotals | null {
  if (!(quantity > 0)) return null;
  try {
    return nutritionForFood(food, quantity, unit);
  } catch {
    return null;
  }
}

/** The moment of logging: how much, of which unit, for which meal, and exactly what it comes to. */
export function PortionSheet({ mode, food, initial, initialMeal, onClose, onConfirm, onDelete }: Props) {
  const { settings, favorites } = useAppState();
  const [quantityText, setQuantityText] = useState(formatQuantity(initial.quantity));
  const [unit, setUnit] = useState(initial.unit);
  const [meal, setMeal] = useState<MealType | null>(initialMeal);

  const quantity = parseNumber(quantityText);
  const nutrition = safeNutrition(food, quantity, unit);
  const autoMeal = mealForTime(new Date(), settings.mealStartHours);
  const isFavorite = favorites.includes(food.id);
  const approximate = food.nutritionConfidence === "low" || food.variability === "high";
  const adding = mode === "add";
  const buttonLabel = adding
    ? `Add to ${MEAL_LABELS[meal ?? autoMeal]}${nutrition ? ` · ${formatNumber(nutrition.calories)} kcal` : ""}`
    : "Save changes";

  return (
    <Sheet
      open
      onClose={onClose}
      title={food.name}
      subtitle={categoryLabel(food.category)}
      headerAction={
        <IconButton
          label={isFavorite ? "Remove from favourites" : "Add to favourites"}
          icon={<IconStar className={cx(isFavorite && styles.starOn)} />}
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(food.id)}
        />
      }
      footer={
        <>
          {onDelete && <IconButton label="Delete" icon={<IconTrash />} variant="danger" onClick={onDelete} />}
          <Button variant="primary" size="lg" block disabled={!nutrition} onClick={() => nutrition && onConfirm({ quantity, unit, meal })}>{buttonLabel}</Button>
        </>
      }
    >
      <NutritionSummary nutrition={nutrition} approximate={approximate} />

      <SectionLabel>How much</SectionLabel>
      <QuantityControl food={food} quantityText={quantityText} unit={unit} onQuantityText={setQuantityText} onUnit={setUnit} />

      <SectionLabel>Meal</SectionLabel>
      <div className="scroll-row" role="radiogroup" aria-label="Meal">
        {adding && <Chip role="radio" selected={meal === null} onClick={() => setMeal(null)}>Auto · {MEAL_LABELS[autoMeal]}</Chip>}
        {MEAL_ORDER.map((m) => <Chip key={m} role="radio" selected={meal === m} onClick={() => setMeal(m)}>{MEAL_LABELS[m]}</Chip>)}
      </div>
    </Sheet>
  );
}
