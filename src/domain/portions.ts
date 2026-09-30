/* Quantity and unit choices for one food, and the wording of a portion.
 * A food offers its own servings (from the data) plus grams, plus millilitres for drinks.
 */
import type { LastUsed } from "../data/types.ts";
import { formatQuantity, sentenceCase } from "../lib/format.ts";
import { foodToGrams } from "../nutrition/calculate.ts";
import type { Food } from "../nutrition/types.ts";

const MASS_UNIT = "g";
const VOLUME_UNIT = "ml";
const STEP_MEASURED = 10;
const STEP_COUNTED = 0.5;
const ROUND_MEASURED_TO = 5;
const MIN_COUNTED = 0.5;
const MIN_MEASURED = 5;

/** One-tap amounts for counted foods ("3 rotis"). Anything else, halves included, is typed or stepped. */
export const QUICK_AMOUNTS: readonly number[] = [1, 2, 3, 4, 5];

export interface PortionOption {
  unit: string;
  label: string;
}

export const isMeasuredUnit = (unit: string): boolean => unit === MASS_UNIT || unit === VOLUME_UNIT;

/** "1 dosa" -> "dosa"; "2 dosa" (a plate) -> "plate (2 dosa)". */
function servingWording(unit: string, label: string): string {
  const single = label.replace(/^1\s+/, "");
  return single !== label ? single : `${unit} (${label})`;
}

export function portionOptions(food: Food): PortionOption[] {
  const own = food.servingOptions.map((o) => ({ unit: o.unit, label: servingWording(o.unit, o.label) }));
  const measured: PortionOption[] = [{ unit: MASS_UNIT, label: "g" }];
  if (food.category === "drinks" || food.densityGPerMl !== 1) measured.push({ unit: VOLUME_UNIT, label: "ml" });
  return food.category === "custom" ? own : [...own, ...measured];
}

export function unitLabel(food: Food, unit: string): string {
  return portionOptions(food).find((o) => o.unit === unit)?.label ?? unit;
}


export function portionText(food: Food, quantity: number, unit: string): string {
  return `${formatQuantity(quantity)} ${unitLabel(food, unit)}`;
}

export function quantityStep(unit: string): number {
  return isMeasuredUnit(unit) ? STEP_MEASURED : STEP_COUNTED;
}

export function minQuantity(unit: string): number {
  return isMeasuredUnit(unit) ? MIN_MEASURED : MIN_COUNTED;
}

/** What to show first: how the person last had this food, else one default serving. */
export function defaultPortion(food: Food, last?: LastUsed): LastUsed {
  if (last && portionOptions(food).some((o) => o.unit === last.unit)) return last;
  return { quantity: 1, unit: food.servingOptions[0]?.unit ?? MASS_UNIT };
}

/** Switching unit keeps the amount of food the same, rounded to a tidy number. */
export function convertQuantity(food: Food, quantity: number, from: string, to: string): number {
  const grams = foodToGrams(food, quantity, from);
  const raw = grams / foodToGrams(food, 1, to);
  if (isMeasuredUnit(to)) return Math.max(MIN_MEASURED, Math.round(raw / ROUND_MEASURED_TO) * ROUND_MEASURED_TO);
  return Math.max(MIN_COUNTED, Math.round(raw / STEP_COUNTED) * STEP_COUNTED);
}

/** How a unit reads on a chip: "medium banana" -> "Medium banana", "g" -> "Grams". */
export function optionDisplayLabel(option: PortionOption): string {
  if (option.unit === MASS_UNIT) return "Grams";
  if (option.unit === VOLUME_UNIT) return "Millilitres";
  return sentenceCase(option.label);
}
