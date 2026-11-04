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
import { daysEatenIn, OFTEN_DAYS } from "../../domain/lately.ts";
import { differentFor, healthyFor, isSabzi, leftOut, moreSabziFor, popularFor, proteinFor, SABZI_MEALS, type DiscoverInput, type Pick } from "./discover.ts";

const LIKELY_SHOWN = 8;
const OTHERS_SHOWN = 12;
const POPULAR_SHOWN = 12;
const HEALTHY_SHOWN = 10;
const PROTEIN_SHOWN = 6;
const DIFFERENT_SHOWN = 8;
/** The commonest foods are in "Popular" already: "something different" is drawn from beyond them. */
const DIFFERENT_AFTER = 40;
const SABZI_SHOWN = 8;
const MORE_SABZI_SHOWN = 6;
/** Shown to a new person until their own habits take over. */
const COMMON_IDS = ["egg_boiled", "banana", "milk_tea", "protein_shake", "roti", "steamed_rice", "chicken_breast"];

/** Why a food is offered, when "you usually have it for this meal" is not the whole story. */
export type Reason =
  | { kind: "earlier"; meal: MealType }
  | { kind: "yesterday" }
  | { kind: "with"; food: Food }
  | { kind: "weekday"; date: string }
  /** Eaten on this many days lately. */
  | { kind: "often"; days: number };

export interface Suggestion {
  food: Food;
  /** Set when one tap can add the food as it is: the amount that is usual for the meal, or the one it was had in earlier. */
  portion?: LastUsed;
  reason?: Reason;
}

/** What a section is, for its icon and its line of explanation. */
export type SectionKind = "likely" | "sabzi" | "more" | "protein" | "popular" | "moreSabzi" | "healthy" | "different";

export interface SuggestionSection {
  kind: SectionKind;
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
  /** Every food there is, and the commonly eaten ones in order: what fills the page beyond what this person has logged. */
  pool?: readonly Food[];
  popular?: readonly Food[];
  /** How each food was last had, for the amount one tap adds. */
  lastUsed?: Record<string, LastUsed>;
  /** What the day still has room for. */
  remaining?: { calories: number; protein: number };
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

export function buildSuggestions({ history, meal, date, today, favorites, customFoods, lookup, pool = [], popular = [], lastUsed = {}, remaining }: Input): SuggestionSection[] {
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
  const usualOverall = usualFoods({ entries: history, meal: null, date, today });
  const usualPortionOf = new Map(usualOverall.map((u) => [u.foodId, u.portion]));
  const daysLately = daysEatenIn(history, today);
  /** A food of theirs, in the amount they usually have, with how much of it they have been eating when that is a lot. */
  const own = (food: Food): Suggestion => {
    const amount = defaultPortion(food, usualPortionOf.get(food.id) ?? lastUsed[food.id]);
    const days = daysLately.get(food.id) ?? 0;
    return { food, portion: lastPortionSummary(food, amount) ? amount : undefined, reason: days >= OFTEN_DAYS ? { kind: "often", days } : undefined };
  };
  const fresh = (food: Food | undefined): food is Food => food !== undefined && !shown.has(food.id) && !inMeal.has(food.id);

  // The sabzis they eat most, for the meals sabzi belongs to.
  const sabzi = SABZI_MEALS.includes(meal)
    ? toFoods(usualOverall.map((u) => u.foodId)).filter((f) => isSabzi(f) && fresh(f)).slice(0, SABZI_SHOWN).map(own)
    : [];
  for (const s of sabzi) shown.add(s.food.id);

  // Then the rest of what they eat and drink, the most eaten first, the foods they marked as favourites ahead of them.
  const others = toFoods([...new Set([...favorites, ...usualOverall.map((u) => u.foodId), ...customFoods.map((f) => f.id)])])
    .filter(fresh)
    .slice(0, OTHERS_SHOWN)
    .map(own);

  // Beyond their own foods: the whole food list, by rules on each food, nothing twice on the page.
  const skip = new Set([...shown, ...others.map((s) => s.food.id), ...inMeal]);
  const discover: DiscoverInput = { pool, popular, meal, seed: date, skip, leftOut: leftOut(history, lookup), lastUsed, remaining };
  const take = (picks: Pick[]): Suggestion[] => {
    for (const p of picks) skip.add(p.food.id);
    return picks;
  };
  const label = MEAL_LABELS[meal].toLowerCase();
  const protein = take(proteinFor(discover, PROTEIN_SHOWN));
  const common = take(popularFor(discover, POPULAR_SHOWN));
  const sabziCuisines = new Set(sabzi.map((s) => s.food.cuisine));
  const moreSabzi = sabzi.length > 0 ? take(moreSabziFor(discover, MORE_SABZI_SHOWN, sabziCuisines)) : [];
  const healthy = take(healthyFor(discover, HEALTHY_SHOWN));
  const different = take(differentFor(discover, DIFFERENT_SHOWN, DIFFERENT_AFTER));

  const all: SuggestionSection[] = [
    { kind: "likely", title: `Likely for ${label}`, items: likely },
    { kind: "sabzi", title: "Your sabzis", items: sabzi },
    { kind: "more", title: likely.length > 0 || sabzi.length > 0 ? "More of your foods" : "Your foods", items: others },
    { kind: "protein", title: `High protein for ${label}`, items: protein },
    { kind: "popular", title: `Popular for ${label}`, items: common },
    { kind: "moreSabzi", title: "More sabzi to try", items: moreSabzi },
    { kind: "healthy", title: `Healthy picks for ${label}`, items: healthy },
    { kind: "different", title: `Something different for ${label}`, items: different },
  ];
  const sections = all.filter((section) => section.items.length > 0);
  return sections.length > 0 ? sections : [{ kind: "popular", title: "Popular", items: toFoods(COMMON_IDS).map(plain) }];
}
