import { describe, expect, it } from "vitest";
import { Device, entry, makeWorld } from "./helpers/harness.ts";

const BASE = 1_767_000_000_000;

describe("per-user isolation", () => {
  it("never shows user A's records to user B, and B cannot overwrite or delete them", async () => {
    const world = makeWorld();
    const alice = await Device.signIn(world, "alice@example.com");
    const bob = await Device.signIn(world, "bob@example.com");
    await alice.sync([entry("secret", BASE, { name: "alice meal" }), { kind: "doc", id: "profile", data: { weight: 60 }, updatedAt: BASE }]);

    // B reading from cursor 0 sees nothing.
    expect(await bob.sync()).toEqual({ cursor: 0, more: false, changes: [] });

    // B writing the same kind+id with a far newer stamp creates B's own record, never touching A's.
    const bobWrite = await bob.sync([entry("secret", BASE + 1_000_000, { name: "bob meal" }), { kind: "doc", id: "profile", data: null, updatedAt: BASE + 5 }]);
    expect(bobWrite.changes).toEqual([]);
    expect(bobWrite.cursor).toBe(2);

    const aliceAfter = await Device.signIn(world, "alice@example.com");
    const pulled = await aliceAfter.sync();
    expect(pulled.changes.map((change) => [change.id, change.data])).toEqual([
      ["secret", { name: "alice meal" }],
      ["profile", { weight: 60 }],
    ]);

    // B's deletion of the account removes only B's rows.
    const res = await world.fetch("/account/delete", { token: bob.token, body: { confirm: true } });
    expect(res.status).toBe(200);
    expect((await aliceAfter.sync([], 0)).changes).toHaveLength(2);
  });

  it("takes the user id from the token and ignores one smuggled into the body", async () => {
    const world = makeWorld();
    const alice = await Device.signIn(world, "alice@example.com");
    const bob = await Device.signIn(world, "bob@example.com");
    await alice.sync([entry("a1", BASE)]);
    const res = await world.fetch("/sync", { token: bob.token, body: { cursor: 0, userId: "dev:alice@example.com", user_id: "dev:alice@example.com", changes: [] } });
    expect(await res.json()).toEqual({ cursor: 0, more: false, changes: [] });
  });

  it("keeps the seq counters of two users independent", async () => {
    const world = makeWorld();
    const alice = await Device.signIn(world, "alice@example.com");
    const bob = await Device.signIn(world, "bob@example.com");
    await alice.sync([entry("a", BASE), entry("b", BASE)]);
    const reply = await bob.sync([entry("a", BASE)]);
    expect(reply.cursor).toBe(1);
  });
});
