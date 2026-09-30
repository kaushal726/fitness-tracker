import categoriesJson from "../../data/categories.json" with { type: "json" };

const LABELS = Object.fromEntries(Object.entries(categoriesJson.categories).map(([id, c]) => [id, c.label])) as Record<string, string>;

export function categoryLabel(id: string): string {
  return id === "custom" ? "Your food" : (LABELS[id] ?? id);
}

/** Category ids in the order the data file lists them. */
export function categoryIds(): string[] {
  return Object.keys(LABELS);
}
