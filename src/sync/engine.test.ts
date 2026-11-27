import "fake-indexeddb/auto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addEntry, addWater, getState, initStore, removeEntry, saveProfile } from "../data/store.ts";
import type { Entry, Profile } from "../data/types.ts";
import { eraseForMismatch, gateFor, getSyncStatus, signOutSafely, startSync, syncNow } from "./engine.ts";
import { FIRST_LINK_STAMP } from "./plan.ts";
import { getSession, setSession, type Session } from "./session.ts";

interface Stored { kind: string; id: string; data: Record<string, unknown> | null; updatedAt: number; seq: number }
interface Pushed { kind: string; id: string; data: Record<string, unknown> | null; updatedAt: number }

interface Account { seq: number; records: Map<string, Stored> }

/** A stand-in for the sync Worker that follows the same rules: each account has its own records, last write wins by updatedAt, and every applied write gets the next seq. */
class FakeCloud {
  online = true;
  accounts = new Map<string, Account>();
  syncs: Pushed[][] = [];

  account(token: string): Account {
    if (!this.accounts.has(token)) this.accounts.set(token, { seq: 0, records: new Map() });
    return this.accounts.get(token)!;
  }

  fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (!this.online) throw new TypeError("offline");
    const path = new URL(String(url)).pathname;
    const token = new Headers(init?.headers).get("Authorization")?.replace("Bearer ", "") ?? "";
    if (path === "/auth/refresh") return Response.json({ token });
    const account = this.account(token);
    const body = JSON.parse(String(init?.body)) as { cursor: number; changes: Pushed[] };
    this.syncs.push(body.changes);
    const written = new Set<string>();
    const lost: Stored[] = [];
    for (const change of body.changes) {
      const key = `${change.kind}:${change.id}`;
      const have = account.records.get(key);
      if (have && have.updatedAt >= change.updatedAt) {
        lost.push(have);
        continue;
      }
      account.records.set(key, { ...change, seq: ++account.seq });
      written.add(key);
    }
    const newer = [...account.records].filter(([key, r]) => r.seq > body.cursor && !written.has(key)).map(([, r]) => r);
    const changes = [...new Map([...lost, ...newer].map((r) => [`${r.kind}:${r.id}`, r])).values()];
    return Response.json({ cursor: account.seq, more: false, changes });
  };

  live(kind: string, account = "token-asha"): Stored[] {
    return [...this.account(account).records.values()].filter((r) => r.kind === kind && r.data !== null);
  }
}

const session = (id: string): Session => ({ token: `token-${id}`, user: { id, email: `${id}@example.test`, name: id, picture: null } });
const profile: Profile = { name: "Asha", age: 30, gender: "female", heightCm: 165, weightKg: 60, goal: "maintain", targetWeightKg: null, weeks: null, activity: "light" };
const entry = (id: string): Entry => ({ id, date: "2026-01-05", at: 1, meal: "lunch", foodId: "roti", name: "Roti", grams: 40, quantity: 1, unit: "piece", nutrition: { calories: 100, protein: 3, carbs: 20, fat: 1, fiber: 2, sugar: 0, sodium: 5 } } as unknown as Entry);

let cloud: FakeCloud;
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  await initStore();
});
afterAll(() => vi.unstubAllGlobals());

beforeEach(async () => {
  cloud = new FakeCloud();
  vi.stubGlobal("fetch", cloud.fetch);
  // A phone that has never been linked: empty data, no link to any account, nobody signed in.
  setSession(null);
  await eraseForMismatch();
  await wait();
});

describe("saving to the account", () => {
  it("sends everything the phone had before it was linked, and sends only what changes after", async () => {
    saveProfile(profile);
    addEntry(entry("e1"));
    addEntry(entry("e2"));
    addWater("2026-01-05", 500);
    setSession(session("asha"));
    await startSync();

    expect(cloud.live("entry").map((r) => r.id).sort()).toEqual(["e1", "e2"]);
    expect(cloud.live("doc").map((r) => r.id).sort()).toEqual(["profile", "settings"]);
    expect(cloud.live("water")[0].data).toEqual({ value: 500 });
    expect(cloud.syncs[0].every((c) => c.updatedAt === FIRST_LINK_STAMP)).toBe(true);
    expect(getSyncStatus().linked).toBe(true);
    expect(getSyncStatus().pending).toBe(0);

    addEntry(entry("e3"));
    await syncNow();
    expect(cloud.syncs.at(-1)?.map((c) => c.id)).toEqual(["e3"]);
    expect(cloud.live("entry")).toHaveLength(3);

    await syncNow();
    expect(cloud.syncs.at(-1)).toEqual([]);
  });

  it("carries a deletion to the account", async () => {
    addEntry(entry("e1"));
    addEntry(entry("e2"));
    setSession(session("asha"));
    await startSync();
    removeEntry("e1");
    await syncNow();
    expect(cloud.live("entry").map((r) => r.id)).toEqual(["e2"]);
    expect(cloud.account("token-asha").records.get("entry:e1")?.data).toBeNull();
  });
});

describe("a new phone", () => {
  it("gets everything back by signing in, deletions included", async () => {
    saveProfile(profile);
    addEntry(entry("e1"));
    addEntry(entry("e2"));
    addWater("2026-01-05", 750);
    setSession(session("asha"));
    await startSync();
    removeEntry("e1");
    await syncNow();

    expect(await signOutSafely()).toBe(true);
    expect(getState().entries).toEqual([]);
    expect(getState().profile).toBeNull();
    expect(getSession()).toBeNull();

    setSession(session("asha"));
    await startSync();
    expect(getState().entries.map((e) => e.id)).toEqual(["e2"]);
    expect(getState().profile?.name).toBe("Asha");
    expect(getState().water).toEqual({ "2026-01-05": 750 });
    expect(gateFor({ configured: true, session: getSession(), syncStatus: getSyncStatus() })).toBe("open");
  });

  it("does not let an empty phone overwrite what the account holds", async () => {
    saveProfile(profile);
    addEntry(entry("e1"));
    setSession(session("asha"));
    await startSync();
    await signOutSafely();

    setSession(session("asha"));
    await startSync();
    expect(cloud.live("entry")).toHaveLength(1);
    expect(getState().entries).toHaveLength(1);
  });

  it("keeps the account's version when the phone and the account disagree about a record from before it was linked", async () => {
    saveProfile(profile);
    setSession(session("asha"));
    await startSync();
    await signOutSafely();

    saveProfile({ ...profile, name: "Local only" });
    setSession(session("asha"));
    await startSync();
    expect(getState().profile?.name).toBe("Asha");
  });
});

describe("signing out", () => {
  it("does not take the data off the phone while some of it is not saved", async () => {
    addEntry(entry("e1"));
    setSession(session("asha"));
    await startSync();
    addEntry(entry("e2"));
    cloud.online = false;
    expect(await signOutSafely()).toBe(false);
    expect(getState().entries).toHaveLength(2);
    expect(getSession()).not.toBeNull();
  });
});

describe("two accounts on one phone", () => {
  it("never mixes them: the other account's data is erased from the phone, and is still in that account", async () => {
    addEntry(entry("e1"));
    setSession(session("asha"));
    await startSync();

    setSession(session("ravi"));
    await startSync();
    expect(getSyncStatus().blocked).toEqual({ kind: "mismatch", ownerEmail: "asha@example.test" });
    expect(gateFor({ configured: true, session: getSession(), syncStatus: getSyncStatus() })).toBe("mismatch");
    expect(cloud.live("entry", "token-ravi")).toEqual([]);

    await eraseForMismatch();
    expect(getState().entries).toEqual([]);
    expect(getSyncStatus().blocked).toBeNull();
    expect(cloud.live("entry", "token-ravi")).toEqual([]);
    expect(cloud.live("entry", "token-asha")).toHaveLength(1);
  });
});

describe("the screen before the app", () => {
  const status = getSyncStatus();
  it("asks for sign-in, waits for the account's data, and opens at once on a phone that already has it", () => {
    expect(gateFor({ configured: false, session: null, syncStatus: status })).toBe("open");
    expect(gateFor({ configured: true, session: null, syncStatus: status })).toBe("signin");
    // Someone who chose to keep their data on the phone goes straight in, until they sign in.
    expect(gateFor({ configured: true, session: null, syncStatus: status, localOnly: true })).toBe("open");
    expect(gateFor({ configured: true, session: session("asha"), syncStatus: { ...status, metaLoaded: false }, localOnly: true })).toBe("loading");
    const who = session("asha");
    expect(gateFor({ configured: true, session: who, syncStatus: { ...status, metaLoaded: false } })).toBe("loading");
    expect(gateFor({ configured: true, session: who, syncStatus: { ...status, metaLoaded: true, linked: false, firstSyncDone: false } })).toBe("loading");
    expect(gateFor({ configured: true, session: who, syncStatus: { ...status, metaLoaded: true, linked: false, firstSyncDone: false, blocked: { kind: "failed" } } })).toBe("retry");
    expect(gateFor({ configured: true, session: who, syncStatus: { ...status, metaLoaded: true, linked: true, firstSyncDone: false, offline: true } })).toBe("open");
  });
});

