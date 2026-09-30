const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

export type HeightUnit = "cm" | "ft";

export function cmFromFeetInches(feet: number, inches: number): number {
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

export function feetInchesFromCm(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches - feet * INCHES_PER_FOOT);
  return inches === INCHES_PER_FOOT ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === "cm") return `${Math.round(cm)} cm`;
  const { feet, inches } = feetInchesFromCm(cm);
  return `${feet} ft ${inches} in`;
}
