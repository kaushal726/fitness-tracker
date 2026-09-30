/* Makes the phone's Back button close the top-most open sheet instead of leaving the
 * screen (or the app).
 *
 * While any sheet is open there is exactly one extra "guard" history entry at the same
 * URL. Back pops it and closes the top sheet (re-adding the guard if more sheets remain).
 * When the last sheet closes from the UI, we pop the guard ourselves. history.back() is
 * asynchronous, so nothing new is pushed until our own pop has landed.
 */
interface OpenSheet {
  id: number;
  close: () => void;
}

const stack: OpenSheet[] = [];
let guardInHistory = false;
let pendingBacks = 0;
let nextId = 1;

function ensureGuard(): void {
  if (stack.length && !guardInHistory && pendingBacks === 0) {
    history.pushState({ sheetGuard: true }, "");
    guardInHistory = true;
  }
}

function popGuard(): void {
  if (!guardInHistory) return;
  guardInHistory = false;
  pendingBacks += 1;
  history.back();
}

// Reloaded while a sheet was open: step off the stale guard entry so Back behaves normally.
if ((history.state as { sheetGuard?: boolean } | null)?.sheetGuard) {
  pendingBacks += 1;
  history.back();
}

window.addEventListener("popstate", () => {
  if (pendingBacks > 0) {
    pendingBacks -= 1;
    ensureGuard();
    return;
  }
  if (!guardInHistory) return; // an ordinary Back outside any sheet
  guardInHistory = false;
  stack.pop()?.close();
  ensureGuard();
});

export function isTopSheet(id: number): boolean {
  return stack[stack.length - 1]?.id === id;
}

export function registerSheet(close: () => void): number {
  const id = nextId++;
  stack.push({ id, close });
  ensureGuard();
  return id;
}

/** Called when a sheet unmounts (closed from the UI, or already closed by Back). */
export function unregisterSheet(id: number): void {
  const index = stack.findIndex((s) => s.id === id);
  if (index < 0) return;
  stack.splice(index, 1);
  if (!stack.length) popGuard();
}
