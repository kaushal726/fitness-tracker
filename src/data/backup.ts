import { APP_NAME } from "../app/brand.ts";
import type { Backup } from "./types.ts";

/** Checks a parsed file is one of this app's backups before it is allowed to replace anything. */
export function parseBackup(text: string): Backup | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const b = data as Partial<Backup>;
  const shapeOk = b.app === "fitly" && b.version === 1 && Array.isArray(b.entries) && Array.isArray(b.customFoods) && Array.isArray(b.favorites);
  const entriesOk = shapeOk && b.entries!.every((e) => e && typeof e.id === "string" && typeof e.date === "string" && typeof e.foodId === "string" && typeof e.nutrition?.calories === "number");
  if (!entriesOk || !b.settings || typeof b.lastUsed !== "object") return null;
  return b as Backup;
}

export function backupFileName(date = new Date()): string {
  return `${APP_NAME.toLowerCase()}-backup-${date.toISOString().slice(0, 10)}.json`;
}
