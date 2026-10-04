import { describe, expect, it } from "vitest";
import { bmi, bmiBand, healthyWeightRange, HEALTHY_BMI, kgOutsideHealthy, weightAtBmi } from "./bmi.ts";

describe("bmi", () => {
  it("is weight over height squared", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
    expect(bmi(100, 170)).toBeCloseTo(34.6, 1);
    expect(bmi(50, 200)).toBeCloseTo(12.5, 6);
  });

  it("puts the edges in the band above them", () => {
    expect(bmiBand(18.49).id).toBe("under");
    expect(bmiBand(18.5).id).toBe("healthy");
    expect(bmiBand(24.99).id).toBe("healthy");
    expect(bmiBand(25).id).toBe("over");
    expect(bmiBand(29.99).id).toBe("over");
    expect(bmiBand(30).id).toBe("obese");
    expect(bmiBand(55).id).toBe("obese");
  });

  it("turns a BMI back into a weight, and a height into its healthy range", () => {
    expect(bmi(weightAtBmi(23, 168), 168)).toBeCloseTo(23, 9);
    const { minKg, maxKg } = healthyWeightRange(170);
    expect(minKg).toBeCloseTo(53.465, 3);
    expect(maxKg).toBeCloseTo(71.961, 3);
    expect(bmi(minKg, 170)).toBeCloseTo(HEALTHY_BMI.min, 9);
    expect(bmiBand(bmi(maxKg, 170)).id).toBe("healthy");
  });

  it("says how far outside the healthy range a weight is, and 0 inside it", () => {
    const { minKg, maxKg } = healthyWeightRange(170);
    expect(kgOutsideHealthy(60, 170)).toBe(0);
    expect(kgOutsideHealthy(maxKg + 8, 170)).toBeCloseTo(8, 9);
    expect(kgOutsideHealthy(minKg - 3, 170)).toBeCloseTo(-3, 9);
  });
});
