/* What to send to the cloud: the records that are new, changed or gone since the last time the phone and the cloud agreed. */
import { fingerprint } from "./hash.ts";
import type { SyncRecord } from "./records.ts";

/** The last time each record was saved, as a fingerprint of what it held. Missing means never saved. */
export type Base = Record<string, string>;

export interface Outgoing extends SyncRecord {
  updatedAt: number;
}

/** Stamp for records that were on the phone before it was ever linked to an account: older than anything edited since, so an account that
 *  already has data keeps it when the two differ. */
export const FIRST_LINK_STAMP = 1;

export const fingerprintOf = (record: SyncRecord): string => fingerprint(JSON.stringify(record.data));

export interface Plan {
  changes: Outgoing[];
  /** The base once every one of these is saved. */
  nextBase: Base;
}

/** The records to send: changed or new ones with their contents, records that are gone as deletions. */
export function planSync(current: Map<string, SyncRecord>, base: Base, now: number, linked: boolean): Plan {
  const stamp = linked ? now : FIRST_LINK_STAMP;
  const changes: Outgoing[] = [];
  const nextBase: Base = {};
  for (const [key, record] of current) {
    const print = fingerprintOf(record);
    nextBase[key] = print;
    if (base[key] !== print) changes.push({ ...record, updatedAt: stamp });
  }
  for (const key of Object.keys(base)) {
    if (current.has(key)) continue;
    const [kind, ...rest] = key.split(":");
    changes.push({ kind: kind as SyncRecord["kind"], id: rest.join(":"), data: null, updatedAt: now });
  }
  return { changes, nextBase };
}
