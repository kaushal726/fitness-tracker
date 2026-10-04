/* A few facts about the month worth saying out loud: the extremes, the favourite, and how varied it was. */
import type { Entry } from "../data/types.ts";
import { monthOf, type MonthId } from "./month.ts";
import { isCounted, type DayStat } from "./monthInsights.ts";

export interface Highlights {
  heaviest: { date: string; calories: number } | null;
  lightest: { date: string; calories: number } | null;
  topProtein: { date: string; protein: number } | null;
  mostLogged: { name: string; times: number } | null;
  /** Different foods eaten this month, and how many of them had never been logged before it. */
  foodsEaten: number;
  newFoods: number;
}

/** Ties go to the earlier day, so the answer does not move around. */
const best = <T>(items: T[], score: (item: T) => number, pickHigher: boolean): T | null =>
  items.reduce<T | null>((chosen, item) => (chosen === null || (pickHigher ? score(item) > score(chosen) : score(item) < score(chosen)) ? item : chosen), null);

export function highlights(entries: Entry[], days: DayStat[], month: MonthId): Highlights {
  const counted = days.filter(isCounted);
  const heaviest = best(counted, (d) => d.totals.calories, true);
  const lightest = best(counted, (d) => d.totals.calories, false);
  const topProtein = best(counted, (d) => d.totals.protein, true);

  const times = new Map<string, { name: string; times: number }>();
  const thisMonth = new Set<string>();
  const before = new Set<string>();
  for (const e of entries) {
    if (monthOf(e.date) === month) {
      thisMonth.add(e.foodId);
      const row = times.get(e.foodId) ?? { name: e.name, times: 0 };
      row.times += 1;
      times.set(e.foodId, row);
    } else if (e.date < `${month}-01`) {
      before.add(e.foodId);
    }
  }
  const favourite = best([...times.values()].sort((a, b) => a.name.localeCompare(b.name)), (r) => r.times, true);

  return {
    heaviest: heaviest && { date: heaviest.date, calories: heaviest.totals.calories },
    lightest: lightest && { date: lightest.date, calories: lightest.totals.calories },
    topProtein: topProtein && { date: topProtein.date, protein: topProtein.totals.protein },
    mostLogged: favourite,
    foodsEaten: thisMonth.size,
    newFoods: [...thisMonth].filter((id) => !before.has(id)).length,
  };
}
