import { useCallback, useMemo, useState } from "react";
import { reviseEntry } from "../../data/entries.ts";
import { replaceEntry, useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { useLogFood, type LogChoice } from "./useLogFood.ts";
import { useRemoveEntry } from "./useRemoveEntry.ts";

export interface AddSession {
  /** What was logged since the page opened, as the store has it now: later edits and removals show here too. */
  entries: Entry[];
  addedFoodIds: Set<string>;
  add: (food: Food, choice: LogChoice) => void;
  revise: (entry: Entry, food: Food, choice: { quantity: number; unit: string; meal: MealType }) => void;
  remove: (entry: Entry) => void;
}

/** One visit to the add page: what it logged, and the ways to change or take back any of it. */
export function useAddSession(date: string): AddSession {
  const { entries } = useAppState();
  const log = useLogFood(date);
  const remove = useRemoveEntry();
  const [ids, setIds] = useState<string[]>([]);

  const added = useMemo(() => entries.filter((e) => ids.includes(e.id)), [entries, ids]);
  const addedFoodIds = useMemo(() => new Set(added.map((e) => e.foodId)), [added]);

  const add = useCallback((food: Food, choice: LogChoice) => {
    const entry = log(food, choice);
    setIds((list) => [...list, entry.id]);
  }, [log]);

  const revise = useCallback<AddSession["revise"]>((entry, food, { quantity, unit, meal }) => {
    replaceEntry(reviseEntry(entry, food, quantity, unit, meal));
  }, []);

  return { entries: added, addedFoodIds, add, revise, remove };
}
