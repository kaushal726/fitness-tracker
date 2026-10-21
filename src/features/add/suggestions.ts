/* What the add page offers before anything is typed: the foods this person usually has for the meal, each one a tap away
 * from being added as it is; then the rest of their own foods; or common ones for someone with no history yet.
 */
import type { Entry, LastUsed } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { defaultPortion, lastPortionSummary } from "../../domain/portions.ts";
import { foodsInMeal, usualFoods } from "../../domain/usuals.ts";
import type { Food, MealType } from "../../nutrition/types.ts";

const USUAL_SHOWN = 6;
const OTHERS_SHOWN = 8;
/** Shown to a new person until their own habits take over. */
const COMMON_IDS = ["egg_boiled", "banana", "milk_tea", "protein_shake", "roti", "steamed_rice", "chicken_breast"];

export interface Suggestion {
  food: Food;
  /** Set when one tap can add the food as it is: the amount that is usual for the meal. */
  portion?: LastUsed;
}

export interface SuggestionSection {
  title: string;
  items: Suggestion[];
}

interface Input {
  /** What was logged before the page opened. */
  history: Entry[];
  meal: MealType;
  /** The day being logged. */
  date: string;
  today: string;
  favorites: string[];
  customFoods: Food[];
  lookup: (id: string) => Food | undefined;
}

const plain = (food: Food): Suggestion => ({ food });

export function buildSuggestions({ history, meal, date, today, favorites, customFoods, lookup }: Input): SuggestionSection[] {
  const toFoods = (ids: string[]): Food[] => ids.map(lookup).filter((f): f is Food => f !== undefined);

  // A food that was deleted is still in the history: it is looked up first, so it cannot leave a gap or an empty list.
  const usual = usualFoods({ entries: history, meal, date, today })
    .flatMap(({ foodId, portion }): Suggestion[] => {
      const food = lookup(foodId);
      if (!food) return [];
      const amount = defaultPortion(food, portion);
      return [{ food, portion: lastPortionSummary(food, amount) ? amount : undefined }];
    })
    .slice(0, USUAL_SHOWN);

  const shown = new Set(usual.map((s) => s.food.id));
  const inMeal = foodsInMeal(history, meal, date);
  const overall = usualFoods({ entries: history, meal: null, date, today }).map((u) => u.foodId);
  const others = toFoods([...new Set([...favorites, ...overall, ...customFoods.map((f) => f.id)])])
    .filter((f) => !shown.has(f.id) && !inMeal.has(f.id))
    .slice(0, OTHERS_SHOWN)
    .map(plain);

  const sections = [
    { title: `Your usual ${MEAL_LABELS[meal].toLowerCase()}`, items: usual },
    { title: usual.length > 0 ? "More of your foods" : "Your foods", items: others },
  ].filter((section) => section.items.length > 0);
  return sections.length > 0 ? sections : [{ title: "Popular", items: toFoods(COMMON_IDS).map(plain) }];
}
