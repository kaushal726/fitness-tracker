/* One plain line about how the account copy is doing. */
import type { SyncStatus } from "./engine.ts";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago". */
export function ago(then: number, now: number): string {
  const elapsed = Math.max(0, now - then);
  if (elapsed < MINUTE_MS) return "just now";
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"} ago`;
  if (elapsed < HOUR_MS) return unit(Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return unit(Math.floor(elapsed / HOUR_MS), "hour");
  return unit(Math.floor(elapsed / DAY_MS), "day");
}

export function savedText(status: Pick<SyncStatus, "syncing" | "offline" | "pending" | "lastSyncedAt">, now: number): string {
  if (status.syncing) return "Saving to your account…";
  if (status.offline) return status.pending > 0 ? "Waiting for internet to save your latest changes" : "No internet right now";
  if (status.pending > 0) return "Saving your latest changes…";
  return status.lastSyncedAt === null ? "Not saved yet" : `All saved · ${ago(status.lastSyncedAt, now)}`;
}
