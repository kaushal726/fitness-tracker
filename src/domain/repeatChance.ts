/* How likely a food is to be eaten again the same day, or the next, before anyone's own habits say. What is cooked once
 * (dal, a sabzi, rice) is on the plate at lunch and again at dinner; a cup of tea, a fresh dosa or a burger is not.
 * It is only the starting guess: carryOver.ts replaces it with what a person's own days show once there are some.
 */

/** Used when a food is not known (it was deleted, or is the person's own). */
export const DEFAULT_REPEAT_CHANCE = 0.12;

const COOKED_ONCE = 0.45;

/** By "category/subCategory", then by category alone. */
const BY_KIND: Record<string, number> = {
  "main_course/roti": 0.25,
  "main_course/paneer": 0.4,
  "main_course/egg": 0.3,
  "breakfast/cereal": 0.1,
  "vegetables/salad": 0.3,
  "vegetables/raw": 0.2,
  "dairy/curd": 0.3,
  "dairy/milk": 0.15,
  "dairy/cheese": 0.1,
  "dairy/butter_ghee": 0.2,
  "condiments/chutney": 0.4,
  "condiments/pickle": 0.4,
  "condiments/raita_dip": 0.4,
  "condiments/papad": 0.3,
  "condiments/sauce": 0.3,
  "snacks/steamed": 0.1,
  "protein/sprouts": 0.25,
  "protein/chicken": 0.25,
  "protein/egg": 0.12,
};
const BY_CATEGORY: Record<string, number> = {
  main_course: COOKED_ONCE,
  staples: COOKED_ONCE,
  vegetables: 0.3,
  breakfast: 0.12,
  dairy: 0.2,
  protein: 0.15,
  condiments: 0.25,
  fruits: 0.12,
  nuts_seeds: 0.1,
  chinese: 0.1,
  sweets: 0.08,
  desserts: 0.08,
  snacks: 0.08,
  drinks: 0.08,
  bakery: 0.08,
  fast_food: 0.05,
  packaged: 0.05,
  supplements: 0.05,
};

export function repeatChance(category: string, subCategory: string): number {
  return BY_KIND[`${category}/${subCategory}`] ?? BY_CATEGORY[category] ?? DEFAULT_REPEAT_CHANCE;
}
