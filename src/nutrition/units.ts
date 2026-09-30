import unitsJson from "../../data/serving-units.json" with { type: "json" };
import { DEFAULT_DENSITY_G_PER_ML } from "./constants.ts";
import type { Food, ServingOption, UnitDef } from "./types.ts";

export const UNITS = unitsJson.units as Record<string, UnitDef>;

/** Every spelling a user might type, mapped to its unit id. */
const ALIAS_TO_UNIT = new Map<string, string>();
for (const [id, def] of Object.entries(UNITS)) {
  ALIAS_TO_UNIT.set(id, id);
  for (const alias of def.aliases) ALIAS_TO_UNIT.set(alias.toLowerCase(), id);
}

/** "Cups", " TBSP", "gms" -> a unit id, or null when the text is not a known unit. */
export function resolveUnitId(input: string): string | null {
  const key = input.trim().toLowerCase().replace(/\.$/, "");
  return ALIAS_TO_UNIT.get(key) ?? (key.endsWith("s") ? ALIAS_TO_UNIT.get(key.slice(0, -1)) ?? null : null);
}

/** "dosa" -> "piece". A unit that is not an alias of another is its own base. */
export function baseUnitId(id: string): string {
  return UNITS[id]?.aliasOf ?? id;
}

type ServingSource = Pick<Food, "servingOptions" | "densityGPerMl"> | { servingOptions: (Omit<ServingOption, "grams"> & { grams?: number })[]; densityGPerMl?: number };

/** The serving the food's own data defines for this unit, if any. Food data always beats the generic table. */
export function findServingOption(food: ServingSource, unitId: string): { grams?: number } | undefined {
  const base = baseUnitId(unitId);
  return food.servingOptions.find((o) => o.unit === unitId) ?? food.servingOptions.find((o) => o.unit === base);
}

/**
 * Grams in `quantity` of `unit` for this food, or null when the food has no way to size that unit
 * (a count unit such as "plate" that the food does not define).
 */
export function gramsFor(food: ServingSource, quantity: number, unit: string): number | null {
  const id = resolveUnitId(unit);
  if (!id) return null;
  const own = findServingOption(food, id);
  if (own?.grams !== undefined) return quantity * own.grams;

  const base = baseUnitId(id);
  if (base === "serving") {
    const first = food.servingOptions[0]?.grams;
    return first === undefined ? null : quantity * first;
  }
  const def = UNITS[base];
  if (!def) return null;
  if (def.kind === "mass") return quantity * (def.gramsPerUnit ?? 0);
  if (def.kind === "volume") return quantity * (def.mlPerUnit ?? 0) * (food.densityGPerMl ?? DEFAULT_DENSITY_G_PER_ML);
  return null;
}
