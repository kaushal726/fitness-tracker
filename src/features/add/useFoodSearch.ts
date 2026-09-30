import { useMemo } from "react";
import { makeFoodLookup, recentFoodIds } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import { browseCategory, searchFood } from "../../nutrition/index.ts";
import type { Food } from "../../nutrition/types.ts";
import { useFoods, type FoodsStatus } from "./useFoods.ts";

const RECENT_LIMIT = 8;
const SUGGESTED_LIMIT = 10;
const SEARCH_LIMIT = 60;
/** Shown to a new person until their own habits take over. */
const COMMON_IDS = ["egg_boiled", "banana", "milk_tea", "protein_shake", "roti", "steamed_rice", "chicken_breast"];

export interface Suggestions {
  title: string;
  foods: Food[];
}

export interface FoodBrowser {
  /** The food data is a lazy download; nothing below is filled until it is "ready". */
  status: FoodsStatus;
  retry: () => void;
  /** What to show before anything is typed: the person's own foods, or common ones for a newcomer. */
  suggestions: Suggestions;
  /** Ranked matches for the query, inside the chosen category if there is one. Empty for an empty query. */
  results: Food[];
  /** Every food of the chosen category, commonly eaten first. */
  inCategory: Food[];
}

export function useFoodBrowser(query: string, category: string | null): FoodBrowser {
  const { entries, customFoods, favorites } = useAppState();
  const { status, retry } = useFoods();
  const ready = status === "ready";
  const searching = query.trim() !== "";

  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const recentIds = useMemo(() => recentFoodIds(entries, RECENT_LIMIT), [entries]);

  const suggestions = useMemo<Suggestions>(() => {
    if (!ready) return { title: "", foods: [] };
    const toFoods = (ids: string[]) => ids.map(lookup).filter((f): f is Food => f !== undefined);
    const own = [...new Set([...favorites, ...recentIds])];
    return own.length > 0 ? { title: "Your foods", foods: toFoods(own).slice(0, SUGGESTED_LIMIT) } : { title: "Popular", foods: toFoods(COMMON_IDS) };
  }, [ready, lookup, favorites, recentIds]);

  const results = useMemo(
    () => (ready && searching ? searchFood(query, { limit: SEARCH_LIMIT, category: category ?? undefined, recentIds, favoriteIds: favorites, extraFoods: customFoods }) : []),
    [ready, searching, query, category, recentIds, favorites, customFoods],
  );
  const inCategory = useMemo(() => (ready && category ? browseCategory(category, customFoods) : []), [ready, category, customFoods]);

  return { status, retry, suggestions, results, inCategory };
}
