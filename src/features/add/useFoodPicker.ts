import { useState } from "react";
import { useAppState } from "../../data/store.ts";
import type { LastUsed } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import type { PortionChoice } from "./AmountCard.tsx";
import type { AddSession } from "./useAddSession.ts";
import type { FoodBrowser } from "./useFoodSearch.ts";

/**
 * What every list of foods on the add page shares: which food's amount card is open (one at a time), which foods were
 * already added, and what happens when an amount is confirmed. A list names itself with a slot, so a food that shows
 * in two lists opens in only the one that was tapped.
 */
export interface FoodPicker {
  /** What the amount card's button says, e.g. "Add to Dinner". */
  actionLabel: string;
  isOpen: (slot: string, food: Food) => boolean;
  toggle: (slot: string, food: Food) => void;
  open: (slot: string, food: Food) => void;
  close: () => void;
  add: (food: Food, choice: PortionChoice) => void;
  isAdded: (food: Food) => boolean;
  isFavorite: (food: Food) => boolean;
  last: (food: Food) => LastUsed | undefined;
}

interface Args {
  browser: FoodBrowser;
  session: AddSession;
  /** The meal foods go to, as worded on the button. */
  meal: MealType;
  /** Null while the meal is left to the time of day. */
  mealChoice: MealType | null;
}

const keyOf = (slot: string, food: Food) => `${slot}/${food.id}`;

export function useFoodPicker({ browser, session, meal, mealChoice }: Args): FoodPicker {
  const { lastUsed } = useAppState();
  const [openKey, setOpenKey] = useState<string | null>(null);

  return {
    actionLabel: `Add to ${MEAL_LABELS[meal]}`,
    isOpen: (slot, food) => openKey === keyOf(slot, food),
    toggle: (slot, food) => {
      (document.activeElement as HTMLElement | null)?.blur(); // the phone's keyboard makes way for the card
      setOpenKey((key) => (key === keyOf(slot, food) ? null : keyOf(slot, food)));
    },
    open: (slot, food) => setOpenKey(keyOf(slot, food)),
    close: () => setOpenKey(null),
    add: (food, { quantity, unit }) => {
      session.add(food, { quantity, unit, meal: mealChoice });
      setOpenKey(null);
    },
    isAdded: (food) => session.addedFoodIds.has(food.id),
    isFavorite: (food) => browser.isFavorite(food.id),
    last: (food) => lastUsed[food.id],
  };
}
