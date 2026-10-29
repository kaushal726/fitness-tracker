/* Captures Chrome/Android's "install app" prompt so the Profile screen and the install pop-up can offer it. */
import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  notify();
});
window.addEventListener("appinstalled", () => {
  deferred = null;
  notify();
});

export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export type InstallOutcome = "accepted" | "dismissed";

/** The browser's own install prompt, or null where it is not on offer (already installed, or a browser without one). */
export function useInstallPrompt(): (() => Promise<InstallOutcome>) | null {
  const event = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => deferred);
  if (!event) return null;
  return async () => {
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferred = null;
    notify();
    return outcome;
  };
}
