/** A mouse or trackpad is the main pointer, so a field can take focus without an on-screen keyboard covering the page. */
export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** An iPhone or iPad (an iPad can report itself as a Mac that has a touch screen). */
export function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/** A phone or tablet: the devices an app is put on the home screen of. */
export function isMobileDevice(): boolean {
  return isIos() || isAndroid();
}

/** Firefox on Android has no install prompt of its own to offer; it installs from its menu. */
export function isFirefoxAndroid(): boolean {
  return isAndroid() && /Firefox/i.test(navigator.userAgent);
}
