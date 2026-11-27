import { describe, expect, it, vi } from "vitest";
import { DAY_MS, MAX_CLOCK_SKEW_MS, MAX_REPLY_CHANGES, MINUTE_MS } from "../src/constants.ts";
import { Device, entry, makeWorld } from "./helpers/harness.ts";

const BASE = 1_767_000_000_000;

describe("POST /sync", () => {
  it("takes a first sync of many records and hands them to a second device", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const changes = Array.from({ length: 500 }, (_, index) => entry(`e${index}`, BASE + index));

    const first = await phone.sync(changes);
    expect(first.changes).toEqual([]);
    expect(first.more).toBe(false);
    expect(first.cursor).toBe(500);

    const laptop = await Device.signIn(world, "a@example.com");
    const pulled = await laptop.sync();
    expect(pulled.changes).toHaveLength(500);
    expect(pulled.cursor).toBe(500);
    expect(new Set(pulled.changes.map((change) => change.seq)).size).toBe(500);
    expect(pulled.changes[0]).toMatchObject({ kind: "entry", id: "e0", data: { name: "e0" }, updatedAt: BASE, seq: 1 });
  });

  it("lets a newer edit win and shows it to the other device", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const laptop = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("x", BASE, { name: "old" })]);
    await laptop.sync();

    await laptop.sync([entry("x", BASE + 10, { name: "new" })]);
    const pulled = await phone.sync();
    expect(pulled.changes).toEqual([{ kind: "entry", id: "x", data: { name: "new" }, updatedAt: BASE + 10, seq: 2 }]);
  });

  it("rejects an older edit and returns the server copy so the app converges", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("x", BASE + 10, { name: "newer" })]);

    const reply = await phone.sync([entry("x", BASE, { name: "older" })]);
    expect(reply.changes).toEqual([{ kind: "entry", id: "x", data: { name: "newer" }, updatedAt: BASE + 10, seq: 1 }]);
    expect(reply.cursor).toBe(1);
  });

  it("keeps what the server has on a tie", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("x", BASE, { name: "first" })]);
    const reply = await phone.sync([entry("x", BASE, { name: "second" })]);
    expect(reply.changes).toHaveLength(1);
    expect(reply.changes[0].data).toEqual({ name: "first" });
    expect(reply.cursor).toBe(1);
  });

  it("a tombstone beats an older edit, loses to a newer edit, and comes back with data null", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const laptop = await Device.signIn(world, "a@example.com");

    await phone.sync([entry("x", BASE, { name: "v1" })]);
    await phone.sync([entry("x", BASE + 20, null)]);

    const olderEdit = await laptop.sync([entry("x", BASE + 10, { name: "v2" })], 0);
    expect(olderEdit.changes).toEqual([{ kind: "entry", id: "x", data: null, updatedAt: BASE + 20, seq: 2 }]);

    const newerEdit = await laptop.sync([entry("x", BASE + 30, { name: "v3" })]);
    expect(newerEdit.changes).toEqual([]);
    const pulled = await phone.sync();
    expect(pulled.changes).toEqual([{ kind: "entry", id: "x", data: { name: "v3" }, updatedAt: BASE + 30, seq: 3 }]);
  });

  it("clamps a future updatedAt to now + 5 minutes so a wrong clock cannot win forever", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const world = makeWorld();
      const phone = await Device.signIn(world, "a@example.com");
      const now = Date.now();
      await phone.sync([entry("x", now + 10 * 365 * DAY_MS, { name: "from the future" })]);
      const stored = world.db.raw.prepare("SELECT updated_at FROM records WHERE id = 'x'").get() as { updated_at: number };
      expect(stored.updated_at).toBe(now + MAX_CLOCK_SKEW_MS);

      // Right now an honest edit still loses to the clamped stamp ...
      const losing = await phone.sync([entry("x", now + MINUTE_MS, { name: "soon" })]);
      expect(losing.changes[0].data).toEqual({ name: "from the future" });

      // ... but once the real clock passes it, an honest edit wins: the bad clock did not lock the record.
      vi.setSystemTime(now + MAX_CLOCK_SKEW_MS + MINUTE_MS);
      await phone.sync([entry("x", Date.now(), { name: "later" })]);
      const row = world.db.raw.prepare("SELECT data FROM records WHERE id = 'x'").get() as { data: string };
      expect(JSON.parse(row.data)).toEqual({ name: "later" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("paginates with more=true and a cursor, then reaches the user's current seq", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const total = MAX_REPLY_CHANGES + 250;
    for (let start = 0; start < total; start += 500) {
      const batch = Array.from({ length: Math.min(500, total - start) }, (_, i) => entry(`e${start + i}`, BASE + start + i));
      await phone.sync(batch);
    }

    const laptop = await Device.signIn(world, "a@example.com");
    const page1 = await laptop.sync();
    expect(page1.more).toBe(true);
    expect(page1.changes).toHaveLength(MAX_REPLY_CHANGES);
    expect(page1.cursor).toBe(MAX_REPLY_CHANGES);

    const page2 = await laptop.sync();
    expect(page2.more).toBe(false);
    expect(page2.changes).toHaveLength(250);
    expect(page2.cursor).toBe(total);

    const upToDate = await laptop.sync();
    expect(upToDate).toEqual({ cursor: total, more: false, changes: [] });
  });

  it("rejects the whole request when anything is invalid and applies nothing", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const good = entry("good", BASE);
    const badRequests: unknown[] = [
      { cursor: 0, changes: [good, { kind: "nope", id: "a", data: {}, updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "doc", id: "favorites", data: {}, updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "doc", id: "lastUsed", data: {}, updatedAt: BASE }] },
      { cursor: 0, changes: [good, entry("", BASE)] },
      { cursor: 0, changes: [good, entry("x".repeat(201), BASE)] },
      { cursor: 0, changes: [good, entry("big", BASE, { text: "x".repeat(20_000) })] },
      { cursor: 0, changes: [good, { kind: "entry", id: "arr", data: [1], updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "entry", id: "str", data: "text", updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "entry", id: "nodata", updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "entry", id: "t", data: {}, updatedAt: "soon" }] },
      { cursor: 0, changes: [good, { kind: "entry", id: "t", data: {}, updatedAt: -1 }] },
      { cursor: 0, changes: [good, { kind: "water", id: "not-a-date", data: { value: 1 }, updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "weight", id: "2026-02-30", data: { value: 1 }, updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "water", id: "2026-03-01", data: { value: "lots" }, updatedAt: BASE }] },
      { cursor: 0, changes: [good, { kind: "favorite", id: "f1", data: { at: "yesterday" }, updatedAt: BASE }] },
      { cursor: 0, changes: Array.from({ length: 501 }, (_, i) => entry(`e${i}`, BASE)) },
      { cursor: -1, changes: [good] },
      { cursor: 1.5, changes: [good] },
      { cursor: "0", changes: [good] },
      { cursor: 0, changes: "none" },
      [],
    ];
    for (const body of badRequests) {
      const res = await world.fetch("/sync", { token: phone.token, body });
      expect(res.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid" });
    }
    const garbage = await world.fetch("/sync", { token: phone.token, rawBody: "{not json" });
    expect(garbage.status).toBe(400);
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM records").get()).toEqual({ n: 0 });
    expect(world.db.raw.prepare("SELECT seq FROM users").get()).toEqual({ seq: 0 });
  });

  it("accepts every documented kind", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const reply = await phone.sync([
      entry("e1", BASE),
      { kind: "customFood", id: "cf1", data: { name: "Ladoo" }, updatedAt: BASE },
      { kind: "water", id: "2026-11-27", data: { value: 1500 }, updatedAt: BASE },
      { kind: "weight", id: "2026-11-27", data: { value: 71.5 }, updatedAt: BASE },
      { kind: "favorite", id: "food-9", data: { at: BASE }, updatedAt: BASE },
      { kind: "lastUsed", id: "food-9", data: { qty: 2, unit: "piece" }, updatedAt: BASE },
      { kind: "doc", id: "profile", data: { goal: 2000 }, updatedAt: BASE },
      { kind: "doc", id: "settings", data: { theme: "dark" }, updatedAt: BASE },
      { kind: "favorite", id: "food-8", data: null, updatedAt: BASE },
    ]);
    expect(reply.cursor).toBe(9);
    const laptop = await Device.signIn(world, "a@example.com");
    expect((await laptop.sync()).changes.map((change) => `${change.kind}:${change.id}`)).toEqual([
      "entry:e1",
      "customFood:cf1",
      "water:2026-11-27",
      "weight:2026-11-27",
      "favorite:food-9",
      "lastUsed:food-9",
      "doc:profile",
      "doc:settings",
      "favorite:food-8",
    ]);
  });

  it("keeps the same record kind+id of different kinds apart, and the newest copy of a duplicate inside one request", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([
      { kind: "favorite", id: "food-1", data: { at: 1 }, updatedAt: BASE },
      { kind: "lastUsed", id: "food-1", data: { qty: 1 }, updatedAt: BASE },
      entry("dup", BASE + 5, { v: "newer" }),
      entry("dup", BASE, { v: "older" }),
    ]);
    const laptop = await Device.signIn(world, "a@example.com");
    const pulled = await laptop.sync();
    expect(pulled.changes).toHaveLength(3);
    expect(pulled.changes.find((change) => change.id === "dup")?.data).toEqual({ v: "newer" });
    expect(pulled.cursor).toBe(3);
  });

  it("allocates seq by raising users.seq by the number of applied changes only", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("a", BASE + 10), entry("b", BASE)]);
    await phone.sync([entry("a", BASE), entry("b", BASE + 1), entry("c", BASE)]); // a loses, b and c apply
    expect(world.db.raw.prepare("SELECT seq FROM users").get()).toEqual({ seq: 4 });
    const seqs = world.db.raw.prepare("SELECT id, seq FROM records ORDER BY id").all();
    expect(seqs).toEqual([
      { id: "a", seq: 1 },
      { id: "b", seq: 3 },
      { id: "c", seq: 4 },
    ]);
  });

  it("is atomic: a failing write leaves no partial change and no seq bump", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    world.db.raw.exec("CREATE TRIGGER boom BEFORE INSERT ON records WHEN NEW.id = 'poison' BEGIN SELECT RAISE(ABORT, 'boom'); END");
    const res = await world.fetch("/sync", { token: phone.token, body: { cursor: 0, changes: [entry("fine", BASE), entry("poison", BASE)] } });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "server" });
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM records").get()).toEqual({ n: 0 });
    expect(world.db.raw.prepare("SELECT seq FROM users").get()).toEqual({ seq: 0 });
  });

  it("splits a very large first sync across statements and still stores everything", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    const fat = { text: "y".repeat(19_000) };
    const changes = Array.from({ length: 200 }, (_, i) => entry(`fat${i}`, BASE + i, fat));
    const reply = await phone.sync(changes);
    expect(reply.cursor).toBe(200);
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM records").get()).toEqual({ n: 200 });
  });
});
