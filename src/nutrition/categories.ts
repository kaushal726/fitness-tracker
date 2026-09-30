import categoriesJson from "../../data/categories.json" with { type: "json" };
import type { Food } from "./types.ts";

const LABELS = Object.fromEntries(Object.entries(categoriesJson.categories).map(([id, c]) => [id, c.label])) as Record<string, string>;

export function categoryLabel(id: string): string {
  return id === "custom" ? "Your food" : (LABELS[id] ?? id);
}

/** Category ids in the order the data file lists them. */
export function categoryIds(): string[] {
  return Object.keys(LABELS);
}

/** "south_indian" -> "South indian". Sub-category ids are snake_case words. */
export function subCategoryLabel(id: string): string {
  const words = id.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface SubCategoryCount {
  id: string;
  label: string;
  count: number;
}

/** The sub-categories present in `foods`, biggest first, for filtering a long category list. */
export function subCategoryCounts(foods: readonly Food[]): SubCategoryCount[] {
  const counts = new Map<string, number>();
  for (const f of foods) counts.set(f.subCategory, (counts.get(f.subCategory) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, label: subCategoryLabel(id), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
