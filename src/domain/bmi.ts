/* Body mass index: weight over height squared, and what the usual adult bands call it (the WHO ones).
 * A rough screen, not a verdict: it ignores muscle, frame and where fat sits.
 */

export type BmiBandId = "under" | "healthy" | "over" | "obese";

export interface BmiBand {
  id: BmiBandId;
  label: string;
  /** Short enough to sit under its band on the scale. */
  short: string;
  /** The first BMI that is no longer in this band. */
  below: number;
}

export const BMI_BANDS: readonly BmiBand[] = [
  { id: "under", label: "Underweight", short: "Under", below: 18.5 },
  { id: "healthy", label: "Healthy", short: "Healthy", below: 25 },
  { id: "over", label: "Overweight", short: "Over", below: 30 },
  { id: "obese", label: "Obese", short: "Obese", below: Number.POSITIVE_INFINITY },
];

/** The healthy band as people quote it: 18.5 up to 24.9. */
export const HEALTHY_BMI = { min: 18.5, max: 24.9 } as const;

const CM_PER_M = 100;

const metres = (heightCm: number): number => heightCm / CM_PER_M;

export function bmi(weightKg: number, heightCm: number): number {
  return weightKg / metres(heightCm) ** 2;
}

export function bmiBand(value: number): BmiBand {
  return BMI_BANDS.find((b) => value < b.below) ?? BMI_BANDS[BMI_BANDS.length - 1];
}

/** The weight that gives this BMI at this height. */
export function weightAtBmi(value: number, heightCm: number): number {
  return value * metres(heightCm) ** 2;
}

export function healthyWeightRange(heightCm: number): { minKg: number; maxKg: number } {
  return { minKg: weightAtBmi(HEALTHY_BMI.min, heightCm), maxKg: weightAtBmi(HEALTHY_BMI.max, heightCm) };
}

/** Kilograms to lose (+) or gain (-) to reach the healthy range; 0 inside it. */
export function kgOutsideHealthy(weightKg: number, heightCm: number): number {
  const { minKg, maxKg } = healthyWeightRange(heightCm);
  if (weightKg > maxKg) return weightKg - maxKg;
  if (weightKg < minKg) return weightKg - minKg;
  return 0;
}
