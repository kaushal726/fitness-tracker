import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env.ts";
import { ApiError } from "../lib/http.ts";
import { verifySessionToken } from "./session.ts";
import { findUser } from "./users.ts";

const BEARER = /^Bearer\s+(\S+)$/i;

/** Every route behind this gets `userId` from the verified token only, and only for a user that still exists. */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const token = BEARER.exec(c.req.header("authorization") ?? "")?.[1];
  if (!token) throw new ApiError("unauthorized");
  const userId = await verifySessionToken(c.env, token);
  if (!userId || !(await findUser(c.env.DB, userId))) throw new ApiError("unauthorized");
  c.set("userId", userId);
  await next();
});
