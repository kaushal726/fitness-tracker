/* What a BMI means, in a headline and a line. */
import type { BalanceNote } from "./balanceNote.ts";
import { bmi, bmiBand, healthyWeightRange, kgOutsideHealthy } from "./bmi.ts";
import { formatKg } from "./progressNote.ts";

const oneDecimal = (n: number): string => (Math.round(n * 10) / 10).toLocaleString("en-IN");

/** "56.7-76.3 kg": the weights that give a healthy BMI at this height. */
export function healthyRangeText(heightCm: number): string {
  const { minKg, maxKg } = healthyWeightRange(heightCm);
  return `${oneDecimal(minKg)}\u2013${oneDecimal(maxKg)} kg`;
}

export function bmiNote(weightKg: number, heightCm: number): BalanceNote {
  const band = bmiBand(bmi(weightKg, heightCm));
  const apart = formatKg(kgOutsideHealthy(weightKg, heightCm));
  const range = `For ${heightCm} cm the healthy range is ${healthyRangeText(heightCm)}.`;
  switch (band.id) {
    case "healthy":
      return { tone: "good", headline: "In the healthy range", detail: range };
    case "under":
      return { tone: "warn", headline: `${apart} below the healthy range`, detail: `${range} Eating enough matters more than any target now.` };
    case "over":
      return { tone: "info", headline: `${apart} above the healthy range`, detail: `${range} BMI is a rough screen: it ignores muscle and where fat sits.` };
    case "obese":
      return { tone: "warn", headline: `${apart} above the healthy range`, detail: `${range} BMI is a rough screen: it ignores muscle and where fat sits.` };
  }
}
