/* Who is signed in on this phone: the account's details and the token the cloud gave for it. Kept in localStorage so the app
 * opens signed in, and kept out of the data store so signing out can erase the data without touching it.
 */
import { useSyncExternalStore } from "react";

export const SESSION_KEY = "fitly_session";

export interface SyncUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

export interface Session {
  token: string;
  user: SyncUser;
}

const listeners = new Set<() => void>();
let current: Session | null = read();

function read(): Session | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Partial<Session> | null;
    return saved && typeof saved.token === "string" && saved.user && typeof saved.user.id === "string" ? (saved as Session) : null;
  } catch {
    return null;
  }
}

export const getSession = (): Session | null => current;

export function setSession(next: Session | null): void {
  current = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // The session still holds for this visit.
  }
  listeners.forEach((l) => l());
}

export function useSession(): Session | null {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, getSession);
}
