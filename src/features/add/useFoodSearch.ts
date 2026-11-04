import { useMemo, useState } from "react";
import { entriesOn, makeFoodLookup, recentFoodIds, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import { computePlan } from "../../domain/goals.ts";
import { usualFoods } from "../../domain/usuals.ts";
import { todayISO } from "../../lib/dates.ts";
import { browseCategory, getAllFoods, popularFoods, searchFoodDetailed, type SearchOutcome } from "../../nutrition/index.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { buildSuggestions, type SuggestionSection } from "./suggestions.ts";
import { useFoods, type FoodsStatus } from "./useFoods.ts";

const RECENT_LIMIT = 8;
const SEARCH_LIMIT = 60;

/** Where the foods being added are going: what is suggested is for this meal, on this day. */
export interface AddTarget {
  meal: MealType;
  date: string;
}

export interface FoodBrowser {
  /** The food data is a lazy download; nothing below is filled until it is "ready". */
  status: FoodsStatus;
  retry: () => void;
  /** What to show before anything is typed: what the person usually has for the meal, then their other foods; common ones for a newcomer. */
  suggestions: SuggestionSection[];
  /** Ranked matches for the query, inside the chosen category if there is one. Empty for an empty query. */
  results: Food[];
  /** True when no food has every word typed, so `results` are only the closest. */
  closestMatches: boolean;
  /** Every food of the chosen category, commonly eaten first. */
  inCategory: Food[];
}

export function useFoodBrowser(query: string, category: string | null, { meal, date }: AddTarget): FoodBrowser {
  const { entries, customFoods, favorites, lastUsed, profile, settings } = useAppState();
  const { status, retry } = useFoods();
  const ready = status === "ready";
  const searching = query.trim() !== "";

  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const recentIds = useMemo(() => recentFoodIds(entries, RECENT_LIMIT), [entries]);

  // Worked out from what was logged before the page opened: a food that was just added keeps its place in the list, ticked,
  // instead of the rows moving under the finger.
  const [history] = useState(entries);
  // What the day still has room for, as it was when the page opened.
  const remaining = useMemo(() => {
    if (!profile) return undefined;
    const { targets } = computePlan(profile, settings.customCalories);
    const eaten = sumEntries(entriesOn(history, date));
    return { calories: targets.calories - eaten.calories, protein: targets.protein - eaten.protein };
  }, [profile, settings.customCalories, history, date]);
  const suggestions = useMemo(
    () => (ready ? buildSuggestions({ history, meal, date, today: todayISO(), favorites, customFoods, lookup, pool: getAllFoods(), popular: popularFoods(), lastUsed, remaining }) : []),
    [ready, history, meal, date, favorites, customFoods, lookup, lastUsed, remaining],
  );

  // What is eaten most for this meal, then what is eaten most at all: a search puts these first.
  const frequentIds = useMemo(() => {
    const at = { entries, date, today: todayISO() };
    return [...new Set([...usualFoods({ ...at, meal }), ...usualFoods({ ...at, meal: null })].map((u) => u.foodId))];
  }, [entries, meal, date]);

  const found = useMemo<SearchOutcome>(
    () => (ready && searching ? searchFoodDetailed(query, { limit: SEARCH_LIMIT, category: category ?? undefined, recentIds, frequentIds, favoriteIds: favorites, extraFoods: customFoods }) : { foods: [], closest: false }),
    [ready, searching, query, category, recentIds, frequentIds, favorites, customFoods],
  );
  const inCategory = useMemo(() => (ready && category ? browseCategory(category, customFoods) : []), [ready, category, customFoods]);

  return { status, retry, suggestions, results: found.foods, closestMatches: found.closest, inCategory };
}
