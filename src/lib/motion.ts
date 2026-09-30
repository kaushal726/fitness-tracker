/** True when the device asked for less motion. Animations and the opening screen should stand down. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
