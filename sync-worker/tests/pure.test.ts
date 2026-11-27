import { describe, expect, it } from "vitest";
import { MAX_CLOCK_SKEW_MS, MAX_REPLY_CHANGES } from "../src/constants.ts";
import { clampUpdatedAt, planWrites } from "../src/sync/lww.ts";
import { buildReply } from "../src/sync/reply.ts";
import { recordKeyOf, type OutgoingChange } from "../src/sync/types.ts";
import { parseSyncRequest } from "../src/sync/validate.ts";
import { entry } from "./helpers/harness.ts";

const NOW = 1_767_000_000_000;
const existing = (...rows: [string, string, number][]) => new Map(rows.map(([kind, id, at]) => [recordKeyOf({ kind: kind as "entry", id }), at]));

describe("planWrites (LWW)", () => {
  it("applies new records and strictly newer edits only, numbering them 1..n", () => {
    const writes = planWrites([entry("new", NOW), entry("newer", NOW + 2), entry("tie", NOW + 1), entry("older", NOW)], existing(["entry", "newer", NOW + 1], ["entry", "tie", NOW + 1], ["entry", "older", NOW + 1]), NOW);
    expect(writes.map((w) => [w.id, w.offset])).toEqual([["new", 1], ["newer", 2]]);
  });

  it("clamps updatedAt before comparing", () => {
    expect(clampUpdatedAt(NOW + 10 * MAX_CLOCK_SKEW_MS, NOW)).toBe(NOW + MAX_CLOCK_SKEW_MS);
    expect(clampUpdatedAt(NOW - 5, NOW)).toBe(NOW - 5);
    const [write] = planWrites([entry("x", NOW + 10 * MAX_CLOCK_SKEW_MS)], existing(), NOW);
    expect(write.updatedAt).toBe(NOW + MAX_CLOCK_SKEW_MS);
  });

  it("treats a stored tombstone like any record", () => {
    expect(planWrites([entry("x", NOW + 1)], existing(["entry", "x", NOW + 2]), NOW)).toEqual([]);
    expect(planWrites([entry("x", NOW + 3, null)], existing(["entry", "x", NOW + 2]), NOW)).toHaveLength(1);
  });
});

describe("parseSyncRequest", () => {
  it("defaults a missing cursor and changes, and rejects non-objects", () => {
    expect(parseSyncRequest({})).toEqual({ cursor: 0, changes: [] });
    expect(parseSyncRequest(null)).toBeNull();
    expect(parseSyncRequest("x")).toBeNull();
  });

  it("accepts exactly 500 changes and exactly 20,000 data bytes", () => {
    expect(parseSyncRequest({ changes: Array.from({ length: 500 }, (_, i) => entry(`e${i}`, NOW)) })?.changes).toHaveLength(500);
    const overhead = JSON.stringify({ t: "" }).length;
    expect(parseSyncRequest({ changes: [entry("a", NOW, { t: "x".repeat(20_000 - overhead) })] })).not.toBeNull();
    expect(parseSyncRequest({ changes: [entry("a", NOW, { t: "x".repeat(20_001 - overhead) })] })).toBeNull();
  });

  it("counts bytes, not characters", () => {
    expect(parseSyncRequest({ changes: [entry("a", NOW, { t: "é".repeat(10_000) })] })).toBeNull();
  });

  it("accepts the 200-character id limit and the new kinds", () => {
    expect(parseSyncRequest({ changes: [entry("x".repeat(200), NOW)] })).not.toBeNull();
    expect(parseSyncRequest({ changes: [{ kind: "favorite", id: "f", data: { at: 1 }, updatedAt: NOW }, { kind: "lastUsed", id: "f", data: { a: 1 }, updatedAt: NOW }] })).not.toBeNull();
  });
});

describe("buildReply", () => {
  const change = (id: string, seq: number): OutgoingChange => ({ kind: "entry", id, data: {}, updatedAt: NOW, seq });

  it("merges, de-duplicates and orders by seq; cursor is the user's seq when not paginated", () => {
    const reply = buildReply({ requestCursor: 0, seqAfter: 9, newerOnServer: [change("a", 2), change("b", 3)], losers: [change("b", 3), change("c", 1)] });
    expect(reply).toEqual({ cursor: 9, more: false, changes: [change("c", 1), change("a", 2), change("b", 3)] });
  });

  it("caps at 1,000 with more=true and a cursor at the last returned seq", () => {
    const rows = Array.from({ length: MAX_REPLY_CHANGES + 1 }, (_, i) => change(`e${i}`, i + 1));
    const reply = buildReply({ requestCursor: 0, seqAfter: 5_000, newerOnServer: rows, losers: [] });
    expect(reply.more).toBe(true);
    expect(reply.changes).toHaveLength(MAX_REPLY_CHANGES);
    expect(reply.cursor).toBe(MAX_REPLY_CHANGES);
  });
});
