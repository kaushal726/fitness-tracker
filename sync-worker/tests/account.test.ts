import { describe, expect, it } from "vitest";
import { Device, entry, makeWorld } from "./helpers/harness.ts";

describe("POST /account/delete", () => {
  it("deletes every record and the user row, then the token stops working", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("a", 1_767_000_000_000), entry("b", 1_767_000_000_000, null)]);

    const res = await world.fetch("/account/delete", { token: phone.token, body: { confirm: true } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM records").get()).toEqual({ n: 0 });
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({ n: 0 });
    expect((await world.fetch("/me", { method: "GET", token: phone.token })).status).toBe(401);
  });

  it("needs confirm: true", async () => {
    const world = makeWorld();
    const phone = await Device.signIn(world, "a@example.com");
    await phone.sync([entry("a", 1_767_000_000_000)]);
    for (const body of [{}, { confirm: false }, { confirm: "true" }, { confirm: 1 }]) {
      expect((await world.fetch("/account/delete", { token: phone.token, body })).status).toBe(400);
    }
    expect(world.db.raw.prepare("SELECT COUNT(*) AS n FROM records").get()).toEqual({ n: 1 });
  });

  it("signing in again after a delete starts from an empty account", async () => {
    const world = makeWorld();
    const first = await Device.signIn(world, "a@example.com");
    await first.sync([entry("a", 1_767_000_000_000)]);
    await world.fetch("/account/delete", { token: first.token, body: { confirm: true } });
    const again = await Device.signIn(world, "a@example.com");
    expect(await again.sync()).toEqual({ cursor: 0, more: false, changes: [] });
  });
});
