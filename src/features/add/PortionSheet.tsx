import { useState } from "react";
import { toggleFavorite, useAppState } from "../../data/store.ts";
import type { LastUsed } from "../../data/types.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { categoryLabel } from "../../nutrition/categories.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconStar, IconTrash } from "../../ui/icons";
import { SectionLabel } from "../../ui/SectionLabel";
import { Sheet } from "../../ui/Sheet";
import { MealChips } from "./MealChips.tsx";
import { NutritionSummary } from "./NutritionSummary.tsx";
import { QuantityControl } from "./QuantityControl.tsx";
import { usePortion } from "./usePortion.ts";
import styles from "./PortionSheet.module.css";

interface Props {
  food: Food;
  initial: LastUsed;
  initialMeal: MealType;
  onClose: () => void;
  onConfirm: (choice: { quantity: number; unit: string; meal: MealType }) => void;
  onDelete: () => void;
}

/** Changing a logged entry: how much, of which unit, for which meal, and exactly what it comes to. */
export function PortionSheet({ food, initial, initialMeal, onClose, onConfirm, onDelete }: Props) {
  const { favorites } = useAppState();
  const portion = usePortion(food, initial);
  const [meal, setMeal] = useState(initialMeal);
  const { nutrition } = portion;
  const isFavorite = favorites.includes(food.id);
  const approximate = food.nutritionConfidence === "low" || food.variability === "high";

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
          <IconButton label="Delete" icon={<IconTrash />} variant="danger" onClick={onDelete} />
          <Button variant="primary" size="lg" block disabled={!nutrition} onClick={() => nutrition && onConfirm({ quantity: portion.quantity, unit: portion.unit, meal })}>
            Save changes{nutrition ? ` · ${formatNumber(nutrition.calories)} kcal` : ""}
          </Button>
        </>
      }
    >
      <NutritionSummary nutrition={nutrition} approximate={approximate} />

      <SectionLabel>How much</SectionLabel>
      <QuantityControl food={food} quantityText={portion.quantityText} unit={portion.unit} onQuantityText={portion.setQuantityText} onUnit={portion.setUnit} />

      <SectionLabel>Meal</SectionLabel>
      <MealChips value={meal} onChange={setMeal} />
    </Sheet>
  );
}
