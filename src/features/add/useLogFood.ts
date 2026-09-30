import { useCallback } from "react";
import { buildEntry } from "../../data/entries.ts";
import { addEntry, rememberPortion, removeEntry, useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { atTimeOfDay, todayISO } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { useToast } from "../../ui/Toast";

export interface LogChoice {
  quantity: number;
  unit: string;
  /** Null means "work it out from the time". */
  meal: MealType | null;
}

/** Saves a food, with the amount the person chose, into a day, and tells them what happened, with a way back. */
export function useLogFood(date: string) {
  const { settings } = useAppState();
  const toast = useToast();

  return useCallback(
    (food: Food, choice: LogChoice): Entry => {
      const clock = new Date();
      const entry = buildEntry({
        food,
        quantity: choice.quantity,
        unit: choice.unit,
        meal: choice.meal,
        date,
        settings,
        now: date === todayISO() ? clock : atTimeOfDay(date, clock),
      });
      addEntry(entry);
      rememberPortion(food.id, { quantity: choice.quantity, unit: choice.unit });
      toast(`Added ${food.name} · ${formatNumber(entry.nutrition.calories)} kcal`, { action: { label: "Undo", onClick: () => removeEntry(entry.id) } });
      return entry;
    },
    [date, settings, toast],
  );
}
