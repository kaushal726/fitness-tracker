/* Request validation: pure, and all-or-nothing. A single bad change rejects the whole request. */
import { MAX_CHANGES_PER_REQUEST, MAX_DATA_BYTES, MAX_ID_LENGTH } from "../constants.ts";
import { isRecord } from "../lib/http.ts";
import { DOC_IDS, RECORD_KINDS, type IncomingChange, type RecordData, type RecordKind, type SyncRequest } from "./types.ts";

const DATE_ID = /^(\d{4})-(\d{2})-(\d{2})$/;

const isKind = (value: unknown): value is RecordKind => RECORD_KINDS.some((kind) => kind === value);
const isNonNegativeInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isFiniteNumber = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value);

function isCalendarDate(id: string): boolean {
  const match = DATE_ID.exec(id);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidId(kind: RecordKind, id: string): boolean {
  if (id.length < 1 || id.length > MAX_ID_LENGTH) return false;
  if (kind === "doc") return DOC_IDS.some((docId) => docId === id);
  if (kind === "water" || kind === "weight") return isCalendarDate(id);
  return true;
}

/** The documented shape of the kinds whose data is fixed: water/weight `{ value }`, favorite `{ at }`. */
function hasValidShape(kind: RecordKind, data: RecordData): boolean {
  if (kind === "water" || kind === "weight") return isFiniteNumber(data.value);
  if (kind === "favorite") return isFiniteNumber(data.at);
  return true;
}

function isValidData(kind: RecordKind, data: unknown): data is RecordData | null {
  if (data === null) return true;
  if (!isRecord(data)) return false;
  return new TextEncoder().encode(JSON.stringify(data)).length <= MAX_DATA_BYTES && hasValidShape(kind, data);
}

function parseChange(raw: unknown): IncomingChange | null {
  if (!isRecord(raw)) return null;
  const { kind, id, data, updatedAt } = raw;
  if (!isKind(kind) || typeof id !== "string" || !isValidId(kind, id)) return null;
  if (!isNonNegativeInteger(updatedAt) || !isValidData(kind, data)) return null;
  return { kind, id, data, updatedAt };
}

/** The parsed request, or null when anything in it is invalid. A missing `cursor` or `changes` means 0 and none. */
export function parseSyncRequest(body: unknown): SyncRequest | null {
  if (!isRecord(body)) return null;
  const cursor = body.cursor === undefined ? 0 : body.cursor;
  const rawChanges = body.changes === undefined ? [] : body.changes;
  if (!isNonNegativeInteger(cursor) || !Array.isArray(rawChanges) || rawChanges.length > MAX_CHANGES_PER_REQUEST) return null;
  const changes: IncomingChange[] = [];
  for (const raw of rawChanges) {
    const change = parseChange(raw);
    if (!change) return null;
    changes.push(change);
  }
  return { cursor, changes };
}
