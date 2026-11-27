import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet, type JWTPayload } from "jose";
import { describe, expect, it } from "vitest";
import { verifyGoogleIdToken } from "../src/auth/google.ts";
import { issueSessionToken } from "../src/auth/session.ts";
import { DAY_MS, SESSION_DAYS } from "../src/constants.ts";
import { Device, makeWorld } from "./helpers/harness.ts";

const unauthorized = { error: "unauthorized" };

describe("session token", () => {
  it("rejects a missing, malformed, tampered, wrong-secret and expired token on every protected route", async () => {
    const world = makeWorld();
    const device = await Device.signIn(world, "a@example.com");
    const expired = await issueSessionToken(world.env, "dev:a@example.com", Date.now() - (SESSION_DAYS + 1) * DAY_MS);
    const wrongSecret = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("dev:a@example.com").setExpirationTime("1h").sign(new TextEncoder().encode("another-secret-another-secret-123456"));
    const noneAlg = `${btoa(JSON.stringify({ alg: "none" }))}.${btoa(JSON.stringify({ sub: "dev:a@example.com" }))}.`;
    const tokens: (string | undefined)[] = [undefined, "garbage", `${device.token}x`, expired, wrongSecret, noneAlg];

    const routes = [
      { path: "/me", method: "GET" },
      { path: "/auth/refresh", method: "POST", body: {} },
      { path: "/sync", method: "POST", body: { cursor: 0, changes: [] } },
      { path: "/account/delete", method: "POST", body: { confirm: true } },
    ];
    for (const route of routes) {
      for (const token of tokens) {
        const res = await world.fetch(route.path, { method: route.method, token, body: route.body });
        expect(res.status, `${route.path} ${String(token).slice(0, 12)}`).toBe(401);
        expect(await res.json()).toEqual(unauthorized);
      }
    }
    expect(world.db.raw.prepare("SELECT id FROM users").all()).toHaveLength(1);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    const world = makeWorld();
    const device = await Device.signIn(world, "a@example.com");
    await world.fetch("/account/delete", { token: device.token, body: { confirm: true } });
    const res = await world.fetch("/sync", { token: device.token, body: { cursor: 0, changes: [] } });
    expect(res.status).toBe(401);
  });

  it("answers 500 server (not 401) when SESSION_SECRET is missing or too short", async () => {
    const world = makeWorld();
    const device = await Device.signIn(world, "a@example.com");
    world.env.SESSION_SECRET = "short";
    const res = await world.fetch("/me", { method: "GET", token: device.token });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "server" });
  });

  it("refresh returns a new token that works, and /me returns the user", async () => {
    const world = makeWorld();
    const device = await Device.signIn(world, "a@example.com");
    const refreshed = (await (await world.fetch("/auth/refresh", { token: device.token, body: {} })).json()) as { token: string };
    const me = await world.fetch("/me", { method: "GET", token: refreshed.token });
    expect(await me.json()).toEqual({ user: { id: "dev:a@example.com", email: "a@example.com", name: "a", picture: null } });
  });
});

describe("POST /auth/dev", () => {
  it("is a 404 unless ALLOW_DEV_AUTH is 1", async () => {
    const world = makeWorld({ devAuth: false });
    const res = await world.fetch("/auth/dev", { body: { email: "a@example.com" } });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(world.db.raw.prepare("SELECT id FROM users").all()).toHaveLength(0);
  });

  it("rejects a body without a valid email", async () => {
    const world = makeWorld();
    for (const body of [{}, { email: 5 }, { email: "nope" }]) {
      expect((await world.fetch("/auth/dev", { body })).status).toBe(400);
    }
  });
});

describe("POST /auth/google", () => {
  it("upserts the user from a verified identity and returns a session token", async () => {
    const world = makeWorld({ verifyGoogle: async () => ({ sub: "g-123", email: "g@example.com", name: "Gee", picture: "https://pic" }) });
    const res = await world.fetch("/auth/google", { body: { idToken: "anything" } });
    const body = (await res.json()) as { token: string; user: unknown };
    expect(body.user).toEqual({ id: "g-123", email: "g@example.com", name: "Gee", picture: "https://pic" });
    const me = await world.fetch("/me", { method: "GET", token: body.token });
    expect(me.status).toBe(200);
  });

  it("is 401 when Google verification fails, 400 without a token", async () => {
    const { ApiError } = await import("../src/lib/http.ts");
    const world = makeWorld({
      verifyGoogle: async () => {
        throw new ApiError("unauthorized");
      },
    });
    expect((await world.fetch("/auth/google", { body: { idToken: "bad" } })).status).toBe(401);
    expect((await world.fetch("/auth/google", { body: {} })).status).toBe(400);
  });
});

describe("verifyGoogleIdToken", () => {
  const CLIENT_ID = "client-123";

  async function setup() {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = { ...(await exportJWK(publicKey)), alg: "RS256", use: "sig" };
    const keys = createLocalJWKSet({ keys: [jwk] });
    const sign = (claims: JWTPayload, options: { issuer?: string; audience?: string; expires?: string } = {}) =>
      new SignJWT({ email: "g@example.com", email_verified: true, name: "Gee", ...claims })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject("g-1")
        .setIssuer(options.issuer ?? "https://accounts.google.com")
        .setAudience(options.audience ?? CLIENT_ID)
        .setExpirationTime(options.expires ?? "1h")
        .sign(privateKey);
    return { keys, sign };
  }

  it("accepts a good token, with either issuer spelling", async () => {
    const { keys, sign } = await setup();
    expect(await verifyGoogleIdToken(await sign({}), CLIENT_ID, keys)).toMatchObject({ sub: "g-1", email: "g@example.com", name: "Gee" });
    expect(await verifyGoogleIdToken(await sign({}, { issuer: "accounts.google.com" }), CLIENT_ID, keys)).toMatchObject({ sub: "g-1" });
  });

  it("rejects a wrong audience, wrong issuer, expired token, unverified email and a foreign signature", async () => {
    const { keys, sign } = await setup();
    const other = await setup();
    const bad = [
      await sign({}, { audience: "someone-else" }),
      await sign({}, { issuer: "https://evil.example" }),
      await sign({}, { expires: "-1h" }),
      await sign({ email_verified: false }),
      await sign({ email_verified: "true" }),
      await other.sign({}),
      "not-a-jwt",
    ];
    for (const token of bad) await expect(verifyGoogleIdToken(token, CLIENT_ID, keys)).rejects.toMatchObject({ code: "unauthorized" });
  });
});
