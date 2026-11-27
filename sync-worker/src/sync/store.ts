/* The D1 layer of /sync. Every statement is scoped to the user id passed in (taken from the verified token).
 * Keys and rows travel as one JSON array parameter read with json_each, so a request costs a handful of
 * statements however many records it carries (the free plan allows 50 per invocation, and 100 bound parameters each). */
import { MAX_REPLY_CHANGES, MAX_STATEMENT_PAYLOAD_BYTES } from "../constants.ts";
import type { PlannedWrite } from "./lww.ts";
import { recordKeyOf, type OutgoingChange, type RecordKey, type RecordKind } from "./types.ts";

interface RecordRow {
  kind: RecordKind;
  id: string;
  data: string | null;
  updated_at: number;
  seq: number;
}

const toOutgoing = (row: RecordRow): OutgoingChange => ({
  kind: row.kind,
  id: row.id,
  data: row.data === null ? null : (JSON.parse(row.data) as Record<string, unknown>),
  updatedAt: row.updated_at,
  seq: row.seq,
});

const KEYS_IN_PARAM = `(kind, id) IN (SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?2))`;
const keysParam = (keys: readonly RecordKey[]): string => JSON.stringify(keys.map(({ kind, id }) => [kind, id]));

/** The updated_at the server holds for each of these records (a tombstone counts), keyed by recordKeyOf. */
export async function fetchUpdatedAt(db: D1Database, userId: string, keys: readonly RecordKey[]): Promise<Map<string, number>> {
  if (keys.length === 0) return new Map();
  const { results } = await db
    .prepare(`SELECT kind, id, updated_at FROM records WHERE user_id = ?1 AND ${KEYS_IN_PARAM}`)
    .bind(userId, keysParam(keys))
    .all<Pick<RecordRow, "kind" | "id" | "updated_at">>();
  return new Map(results.map((row) => [recordKeyOf(row), row.updated_at]));
}

/** Splits the writes into groups whose serialized rows stay under the per-statement limit. */
function chunkWrites(writes: readonly PlannedWrite[]): string[] {
  const chunks: string[] = [];
  let rows: unknown[][] = [];
  let bytes = 0;
  const flush = () => {
    if (rows.length > 0) chunks.push(JSON.stringify(rows));
    rows = [];
    bytes = 0;
  };
  for (const write of writes) {
    const data = write.data === null ? null : JSON.stringify(write.data);
    const size = (data?.length ?? 0) + write.id.length + 64;
    if (bytes + size > MAX_STATEMENT_PAYLOAD_BYTES) flush();
    rows.push([write.kind, write.id, data, write.updatedAt, write.offset]);
    bytes += size;
  }
  flush();
  return chunks;
}

/* Guarded upsert: even if another request got in after we read, an older change can never overwrite a newer record.
 * The seq is the user's seq at the time of the batch plus the change's offset; users.seq grows afterwards by the count. */
const UPSERT_ROWS = `
  INSERT INTO records (user_id, kind, id, data, updated_at, seq)
  SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), json_extract(value, '$[3]'),
         (SELECT seq FROM users WHERE id = ?1) + json_extract(value, '$[4]')
  FROM json_each(?2) WHERE true
  ON CONFLICT (user_id, kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, seq = excluded.seq
  WHERE excluded.updated_at > records.updated_at`;

const SEQ_BEFORE_THIS_REQUEST = "(SELECT seq FROM users WHERE id = ?1) - ?3";

export interface SyncOutcome {
  seqAfter: number;
  newerOnServer: OutgoingChange[];
  losers: OutgoingChange[];
}

/**
 * One atomic batch: write the applied changes, bump users.seq by their count, then read back what the app is missing.
 * Own writes are exactly the seqs above (seqAfter - applied), so everything at or below that line was not written here.
 */
export async function applySync(
  db: D1Database,
  userId: string,
  cursor: number,
  writes: readonly PlannedWrite[],
  requestedKeys: readonly RecordKey[],
  nowMs: number,
): Promise<SyncOutcome> {
  const applied = writes.length;
  const upserts = chunkWrites(writes).map((rows) => db.prepare(UPSERT_ROWS).bind(userId, rows));
  const statements: D1PreparedStatement[] = [
    ...upserts,
    db.prepare("UPDATE users SET seq = seq + ?2, last_seen = ?3 WHERE id = ?1").bind(userId, applied, nowMs),
    db.prepare("SELECT seq FROM users WHERE id = ?1").bind(userId),
    db
      .prepare(`SELECT kind, id, data, updated_at, seq FROM records WHERE user_id = ?1 AND seq > ?2 AND seq <= ${SEQ_BEFORE_THIS_REQUEST} ORDER BY seq LIMIT ?4`)
      .bind(userId, cursor, applied, MAX_REPLY_CHANGES + 1),
  ];
  if (requestedKeys.length > 0) {
    statements.push(
      db
        .prepare(`SELECT kind, id, data, updated_at, seq FROM records WHERE user_id = ?1 AND ${KEYS_IN_PARAM} AND seq <= ${SEQ_BEFORE_THIS_REQUEST}`)
        .bind(userId, keysParam(requestedKeys), applied),
    );
  }
  const results = await db.batch(statements);
  const [seqRows, newerRows, loserRows] = results.slice(upserts.length + 1);
  const seqAfter = (seqRows.results[0] as { seq: number } | undefined)?.seq;
  if (seqAfter === undefined) throw new Error("User row missing");
  return {
    seqAfter,
    newerOnServer: (newerRows.results as RecordRow[]).map(toOutgoing),
    losers: ((loserRows?.results ?? []) as RecordRow[]).map(toOutgoing),
  };
}

/** Deletes every record and the user row in one atomic batch. */
export async function deleteAccount(db: D1Database, userId: string): Promise<void> {
  await db.batch([db.prepare("DELETE FROM records WHERE user_id = ?1").bind(userId), db.prepare("DELETE FROM users WHERE id = ?1").bind(userId)]);
}
