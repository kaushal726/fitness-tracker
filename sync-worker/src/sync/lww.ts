/* Last-write-wins, as a pure function: which incoming changes get applied, given what the server already holds. */
import { MAX_CLOCK_SKEW_MS } from "../constants.ts";
import { recordKeyOf, type IncomingChange } from "./types.ts";

/** A wrong device clock can never win forever: updatedAt is capped at now + 5 minutes. */
export const clampUpdatedAt = (updatedAt: number, nowMs: number): number => Math.min(updatedAt, nowMs + MAX_CLOCK_SKEW_MS);

/** A change that will be written. `offset` (1..n) is added to the user's current seq to get this record's seq. */
export interface PlannedWrite extends IncomingChange {
  offset: number;
}

/**
 * `existing` maps a record key (see recordKeyOf) to the updated_at the server holds (a tombstone counts like any record).
 * A change is applied only when it is strictly newer; a tie keeps the server's copy.
 * If one request carries the same record twice, only the newest copy (the later one on a tie) is considered.
 */
export function planWrites(changes: readonly IncomingChange[], existing: ReadonlyMap<string, number>, nowMs: number): PlannedWrite[] {
  const newestByKey = new Map<string, IncomingChange>();
  for (const change of changes) {
    const clamped = { ...change, updatedAt: clampUpdatedAt(change.updatedAt, nowMs) };
    const key = recordKeyOf(clamped);
    const best = newestByKey.get(key);
    if (!best || clamped.updatedAt >= best.updatedAt) newestByKey.set(key, clamped);
  }
  const writes: PlannedWrite[] = [];
  for (const [key, change] of newestByKey) {
    const serverUpdatedAt = existing.get(key);
    if (serverUpdatedAt !== undefined && change.updatedAt <= serverUpdatedAt) continue;
    writes.push({ ...change, offset: writes.length + 1 });
  }
  return writes;
}
