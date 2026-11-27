import { describe, expect, it } from "vitest";
import { makeWorld, ORIGIN } from "./helpers/harness.ts";

describe("CORS and basic routes", () => {
  it("answers a preflight from an allowed origin with 204 and the exact allow lists, no credentials", async () => {
    const world = makeWorld();
    const res = await world.fetch("/sync", { method: "OPTIONS", origin: ORIGIN });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(res.headers.get("access-control-allow-headers")).toBe("Authorization,Content-Type");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET,POST,OPTIONS");
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
    expect(res.headers.get("vary")).toContain("Origin");
  });

  it("echoes only a listed origin on real responses; others get no allow-origin header", async () => {
    const world = makeWorld();
    const allowed = await world.fetch("/health", { method: "GET", origin: "http://[::1]:8790" });
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://[::1]:8790");
    expect(allowed.headers.get("vary")).toContain("Origin");
    for (const origin of ["https://evil.example", "https://kaushal726.github.io.evil.example", "null"]) {
      const res = await world.fetch("/health", { method: "GET", origin });
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    }
    const preflight = await world.fetch("/sync", { method: "OPTIONS", origin: "https://evil.example" });
    expect(preflight.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("serves /health without auth, never sets a cookie, and answers unknown routes with not_found", async () => {
    const world = makeWorld();
    const health = await world.fetch("/health", { method: "GET" });
    expect(await health.json()).toEqual({ ok: true });
    expect(health.headers.get("set-cookie")).toBeNull();
    expect(health.headers.get("cache-control")).toBe("no-store");
    const missing = await world.fetch("/nope", { method: "GET" });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "not_found" });
    const signIn = await world.fetch("/auth/dev", { body: { email: "a@example.com" } });
    expect(signIn.headers.get("set-cookie")).toBeNull();
  });
});
