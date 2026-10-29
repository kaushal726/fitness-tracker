/* What the add page offers before anything is typed: the foods likely for the meal, each one a tap away from being added as
 * it is, and why; then the rest of the person's own foods; or common ones for someone with no history yet.
 *
 * "Likely" comes from four things in the person's own days: what they usually eat for the meal, what they already ate today
 * (a dish cooked in the morning is on the plate again at lunch), what they ate yesterday (leftovers), and what usually
 * comes with what is already in the meal. A food that two of them point at is offered once, under the most telling reason.
 */
import type { Entry, LastUsed } from "../../data/types.ts";
import { carryOvers, type Carry } from "../../domain/carryOver.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { defaultPortion, lastPortionSummary } from "../../domain/portions.ts";
import { DEFAULT_REPEAT_CHANCE, repeatChance } from "../../domain/repeatChance.ts";
import { foodsInMeal, usualFoods, type Usual } from "../../domain/usuals.ts";
import type { Food, MealType } from "../../nutrition/types.ts";

const LIKELY_SHOWN = 6;
const OTHERS_SHOWN = 8;
/** Shown to a new person until their own habits take over. */
const COMMON_IDS = ["egg_boiled", "banana", "milk_tea", "protein_shake", "roti", "steamed_rice", "chicken_breast"];

/** Why a food is offered, when "you usually have it for this meal" is not the whole story. */
export type Reason =
  | { kind: "earlier"; meal: MealType }
  | { kind: "yesterday" }
  | { kind: "with"; food: Food }
  | { kind: "weekday"; date: string };

export interface Suggestion {
  food: Food;
  /** Set when one tap can add the food as it is: the amount that is usual for the meal, or the one it was had in earlier. */
  portion?: LastUsed;
  reason?: Reason;
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

interface Merged {
  foodId: string;
  score: number;
  days: number;
  usual?: Usual;
  carry?: Carry;
}

/** The usual foods and the carried-over ones in one list, the likeliest first. */
function rankLikely(usuals: Usual[], carries: Carry[]): Merged[] {
  const merged = new Map<string, Merged>();
  for (const usual of usuals) merged.set(usual.foodId, { foodId: usual.foodId, score: usual.score, days: usual.days, usual });
  for (const carry of carries) {
    const have = merged.get(carry.foodId);
    if (have) {
      have.score += carry.score;
      have.carry = carry;
    } else {
      merged.set(carry.foodId, { foodId: carry.foodId, score: carry.score, days: 0, carry });
    }
  }
  return [...merged.values()].sort((a, b) => b.score - a.score || b.days - a.days || (a.foodId < b.foodId ? -1 : 1));
}

function reasonFor({ carry, usual }: Merged, date: string, lookup: (id: string) => Food | undefined): Reason | undefined {
  if (carry) return carry.kind === "earlier" ? { kind: "earlier", meal: carry.from } : { kind: "yesterday" };
  const partner = usual?.partner ? lookup(usual.partner) : undefined;
  if (partner) return { kind: "with", food: partner };
  return usual?.weekday ? { kind: "weekday", date } : undefined;
}

export function buildSuggestions({ history, meal, date, today, favorites, customFoods, lookup }: Input): SuggestionSection[] {
  const toFoods = (ids: string[]): Food[] => ids.map(lookup).filter((f): f is Food => f !== undefined);
  const priorOf = (id: string): number => {
    const food = lookup(id);
    return food ? repeatChance(food.category, food.subCategory) : DEFAULT_REPEAT_CHANCE;
  };

  // A food that was deleted is still in the history: it is looked up first, so it cannot leave a gap or an empty list.
  const likely = rankLikely(usualFoods({ entries: history, meal, date, today }), carryOvers({ entries: history, meal, date, priorOf }))
    .flatMap((m): Suggestion[] => {
      const food = lookup(m.foodId);
      if (!food) return [];
      // What was eaten earlier today is offered in that amount; otherwise the amount that is usual for the meal.
      const amount = defaultPortion(food, m.carry?.kind === "earlier" ? m.carry.portion : (m.usual?.portion ?? m.carry?.portion));
      return [{ food, portion: lastPortionSummary(food, amount) ? amount : undefined, reason: reasonFor(m, date, lookup) }];
    })
    .slice(0, LIKELY_SHOWN);

  const shown = new Set(likely.map((s) => s.food.id));
  const inMeal = foodsInMeal(history, meal, date);
  const overall = usualFoods({ entries: history, meal: null, date, today }).map((u) => u.foodId);
  const others = toFoods([...new Set([...favorites, ...overall, ...customFoods.map((f) => f.id)])])
    .filter((f) => !shown.has(f.id) && !inMeal.has(f.id))
    .slice(0, OTHERS_SHOWN)
    .map(plain);

  const sections = [
    { title: `Likely for ${MEAL_LABELS[meal].toLowerCase()}`, items: likely },
    { title: likely.length > 0 ? "More of your foods" : "Your foods", items: others },
  ].filter((section) => section.items.length > 0);
  return sections.length > 0 ? sections : [{ title: "Popular", items: toFoods(COMMON_IDS).map(plain) }];
}
