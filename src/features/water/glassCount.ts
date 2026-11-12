/** "1 glass", "2.5 glasses": the count in words. */
export function glassCount(glasses: number): string {
  return `${glasses.toLocaleString("en-IN")} ${glasses === 1 ? "glass" : "glasses"}`;
}
