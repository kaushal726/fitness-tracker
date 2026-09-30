import { useMemo } from "react";
import { frequentFoodIds, makeFoodLookup, recentFoodIds } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import { browseCategory, searchFood } from "../../nutrition/index.ts";
import type { Food } from "../../nutrition/types.ts";

const RECENT_LIMIT = 8;
const QUICK_LIMIT = 7;
const FREQUENT_LIMIT = 6;
const SEARCH_LIMIT = 40;
/** Shown to a new person until their own habits take over. */
const DEFAULT_QUICK_IDS = ["egg_boiled", "banana", "milk_tea", "protein_shake", "roti", "steamed_rice", "chicken_breast"];

export interface FoodBrowser {
  recent: Food[];
  favorites: Food[];
  quick: Food[];
  /** Ranked matches for the query, or an empty list for an empty query. */
  results: Food[];
  /** The foods of one category, commonly eaten first. */
  inCategory: (category: string) => Food[];
  isFavorite: (id: string) => boolean;
}

export function useFoodBrowser(query: string): FoodBrowser {
  const { entries, customFoods, favorites } = useAppState();

  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const toFoods = (ids: string[]) => ids.map(lookup).filter((f): f is Food => f !== undefined);

  const recentIds = useMemo(() => recentFoodIds(entries, RECENT_LIMIT), [entries]);
  const quickIds = useMemo(() => [...new Set([...frequentFoodIds(entries, FREQUENT_LIMIT), ...DEFAULT_QUICK_IDS])].slice(0, QUICK_LIMIT), [entries]);
  const results = useMemo(
    () => searchFood(query, { limit: SEARCH_LIMIT, recentIds, favoriteIds: favorites, extraFoods: customFoods }),
    [query, recentIds, favorites, customFoods],
  );

  return {
    recent: toFoods(recentIds),
    favorites: toFoods(favorites),
    quick: toFoods(quickIds),
    results,
    inCategory: (category) => browseCategory(category, customFoods),
    isFavorite: (id) => favorites.includes(id),
  };
}
