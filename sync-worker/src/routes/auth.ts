import { Hono } from "hono";
import { verifyGoogleIdToken, type GoogleVerifier } from "../auth/google.ts";
import { requireUser } from "../auth/middleware.ts";
import { issueSessionToken } from "../auth/session.ts";
import { findUser, upsertUser } from "../auth/users.ts";
import { DEV_USER_PREFIX, MAX_EMAIL_LENGTH } from "../constants.ts";
import type { AppEnv, Bindings, PublicUser } from "../env.ts";
import { ApiError, isRecord, readJson } from "../lib/http.ts";

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+$/;

async function signedIn(env: Bindings, user: PublicUser) {
  return { token: await issueSessionToken(env, user.id), user };
}

export function authRoutes(verifyGoogle: GoogleVerifier = verifyGoogleIdToken): Hono<AppEnv> {
  const routes = new Hono<AppEnv>();

  routes.post("/auth/google", async (c) => {
    const body = await readJson(c);
    if (!isRecord(body) || typeof body.idToken !== "string" || !body.idToken) throw new ApiError("invalid");
    const identity = await verifyGoogle(body.idToken, c.env.GOOGLE_CLIENT_ID);
    const user = await upsertUser(c.env.DB, { id: identity.sub, email: identity.email, name: identity.name, picture: identity.picture }, Date.now());
    return c.json(await signedIn(c.env, user));
  });

  routes.post("/auth/refresh", requireUser, async (c) => c.json({ token: await issueSessionToken(c.env, c.get("userId")) }));

  routes.get("/me", requireUser, async (c) => {
    const user = await findUser(c.env.DB, c.get("userId"));
    if (!user) throw new ApiError("unauthorized");
    return c.json({ user });
  });

  /** Local development only: sign in as any email without Google. A 404 unless ALLOW_DEV_AUTH is "1". */
  routes.post("/auth/dev", async (c) => {
    if (c.env.ALLOW_DEV_AUTH !== "1") throw new ApiError("not_found");
    const body = await readJson(c);
    const email = isRecord(body) && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!SIMPLE_EMAIL.test(email) || email.length > MAX_EMAIL_LENGTH) throw new ApiError("invalid");
    const user = await upsertUser(c.env.DB, { id: `${DEV_USER_PREFIX}${email}`, email, name: email.split("@")[0], picture: null }, Date.now());
    return c.json(await signedIn(c.env, user));
  });

  return routes;
}
