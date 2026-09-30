import { useMemo, useState } from "react";
import type { LastUsed } from "../../data/types.ts";
import { portionNutrition } from "../../domain/portions.ts";
import { formatQuantity, parseNumber } from "../../lib/format.ts";
import type { Food, NutritionTotals } from "../../nutrition/types.ts";

export interface Portion {
  quantityText: string;
  setQuantityText: (text: string) => void;
  unit: string;
  setUnit: (unit: string) => void;
  /** NaN while the text is not a number. */
  quantity: number;
  /** Null while the amount cannot be worked out. */
  nutrition: NutritionTotals | null;
}

/** The amount being chosen for a food: the typed quantity, the unit, and what they come to. */
export function usePortion(food: Food, initial: LastUsed): Portion {
  const [quantityText, setQuantityText] = useState(formatQuantity(initial.quantity));
  const [unit, setUnit] = useState(initial.unit);
  const quantity = parseNumber(quantityText);
  const nutrition = useMemo(() => portionNutrition(food, quantity, unit), [food, quantity, unit]);
  return { quantityText, setQuantityText, unit, setUnit, quantity, nutrition };
}
