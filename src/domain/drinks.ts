/* What was drunk: water, tea and coffee, sweet drinks and alcohol, from the foods logged in the drinks category. */
import type { Entry } from "../data/types.ts";
import type { FoodLookup } from "../data/selectors.ts";
import { isCounted, type DayStat } from "./monthInsights.ts";

const WATER_GLASS_G = 250;
const CUP_G = 150;
const SWEET_SUBS: ReadonlySet<string> = new Set(["soft_drink", "energy_sports", "sharbat", "mocktail", "juice"]);
/** Units that count drinks: "2 pegs" is two drinks, "1 litre" is one entry. */
const COUNTED_UNITS: ReadonlySet<string> = new Set(["glass", "cup", "can", "bottle", "peg", "piece", "serving"]);

export interface DrinkSummary {
  countedDays: number;
  /** Glasses of water (250 ml) on an average counted day. */
  waterGlasses: number;
  /** Cups of tea or coffee (150 ml) on an average counted day, and the calories in them. */
  cups: number;
  cupCalories: number;
  /** Sweet drinks (fizzy, energy, sharbat, juice) in all, with their calories. */
  sweetDrinks: number;
  sweetCalories: number;
  alcoholDrinks: number;
  alcoholCalories: number;
}

const drinksIn = (e: Entry): number => (COUNTED_UNITS.has(e.unit) ? Math.max(1, Math.round(e.quantity)) : 1);

/** Null before a counted day, or when nothing but food was logged. */
export function drinkSummary(entries: Entry[], days: DayStat[], lookup: FoodLookup): DrinkSummary | null {
  const counted = new Set(days.filter(isCounted).map((d) => d.date));
  if (counted.size === 0) return null;
  const s = { waterG: 0, cupG: 0, cupCalories: 0, sweetDrinks: 0, sweetCalories: 0, alcoholDrinks: 0, alcoholCalories: 0 };
  let any = false;
  for (const e of entries) {
    if (!counted.has(e.date)) continue;
    const food = lookup(e.foodId);
    if (food?.category !== "drinks") continue;
    any = true;
    const sub = food.subCategory;
    if (sub === "water") s.waterG += e.grams;
    else if (sub === "tea" || sub === "coffee") {
      s.cupG += e.grams;
      s.cupCalories += e.nutrition.calories;
    } else if (sub === "alcohol") {
      s.alcoholDrinks += drinksIn(e);
      s.alcoholCalories += e.nutrition.calories;
    } else if (SWEET_SUBS.has(sub)) {
      s.sweetDrinks += drinksIn(e);
      s.sweetCalories += e.nutrition.calories;
    }
  }
  if (!any) return null;
  const n = counted.size;
  return {
    countedDays: n,
    waterGlasses: s.waterG / WATER_GLASS_G / n,
    cups: s.cupG / CUP_G / n,
    cupCalories: s.cupCalories / n,
    sweetDrinks: s.sweetDrinks,
    sweetCalories: s.sweetCalories,
    alcoholDrinks: s.alcoholDrinks,
    alcoholCalories: s.alcoholCalories,
  };
}
