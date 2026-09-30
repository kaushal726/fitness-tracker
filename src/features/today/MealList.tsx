import { useState } from "react";
import type { Entry } from "../../data/types.ts";
import { MEAL_ORDER } from "../../domain/meals.ts";
import type { MealType } from "../../nutrition/types.ts";
import { MealCard } from "./MealCard.tsx";

type MealFlags = Record<MealType, boolean>;
type MealCounts = Record<MealType, number>;

interface Props {
  byMeal: Record<MealType, Entry[]>;
  /** The meal being eaten now (only when the screen is showing today). Nothing else starts open. */
  currentMeal: MealType | null;
  onOpenEntry: (entry: Entry) => void;
  onAdd: (meal: MealType) => void;
}

const countsOf = (byMeal: Record<MealType, Entry[]>): MealCounts => Object.fromEntries(MEAL_ORDER.map((m) => [m, byMeal[m].length])) as MealCounts;

/**
 * The day's meals as an accordion, so a full day is a few lines and not a long scroll. The meal being eaten now
 * starts open and the rest are folded to one line that still says what is in them. Food added to a folded
 * meal opens it, so what was just logged is never out of sight. Give it `key={date}` to start afresh on each day.
 */
export function MealList({ byMeal, currentMeal, onOpenEntry, onAdd }: Props) {
  const counts = countsOf(byMeal);
  const [open, setOpen] = useState<MealFlags>(() => Object.fromEntries(MEAL_ORDER.map((m) => [m, m === currentMeal])) as MealFlags);
  const [seen, setSeen] = useState(counts);

  if (MEAL_ORDER.some((m) => counts[m] !== seen[m])) {
    setSeen(counts);
    setOpen((flags) => ({ ...flags, ...Object.fromEntries(MEAL_ORDER.filter((m) => counts[m] > seen[m]).map((m) => [m, true])) }));
  }

  const toggle = (meal: MealType) => setOpen((flags) => ({ ...flags, [meal]: !flags[meal] }));

  return (
    <>
      {MEAL_ORDER.map((meal) => (
        <MealCard key={meal} meal={meal} entries={byMeal[meal]} open={open[meal]} onToggle={toggle} onOpen={onOpenEntry} onAdd={onAdd} />
      ))}
    </>
  );
}
