export const RECORD_KINDS = ["entry", "customFood", "water", "weight", "favorite", "lastUsed", "doc"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const DOC_IDS = ["profile", "settings"] as const;

/** A JSON object stored as record data. */
export type RecordData = Record<string, unknown>;

/** One change as the app sends it. `data: null` is a delete. */
export interface IncomingChange {
  kind: RecordKind;
  id: string;
  data: RecordData | null;
  updatedAt: number;
}

export interface SyncRequest {
  cursor: number;
  changes: IncomingChange[];
}

/** A change as the app receives it, with the server's per-user sequence number. */
export interface OutgoingChange extends IncomingChange {
  seq: number;
}

export interface SyncReply {
  cursor: number;
  more: boolean;
  changes: OutgoingChange[];
}

/** The identity of a record inside one user's data. */
export interface RecordKey {
  kind: RecordKind;
  id: string;
}

export const recordKeyOf = ({ kind, id }: RecordKey): string => JSON.stringify([kind, id]);
