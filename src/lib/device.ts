/** A mouse or trackpad is the main pointer, so a field can take focus without an on-screen keyboard covering the page. */
export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
