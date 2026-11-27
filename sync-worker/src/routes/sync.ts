import { Hono } from "hono";
import { requireUser } from "../auth/middleware.ts";
import type { AppEnv } from "../env.ts";
import { ApiError, isRecord, readJson } from "../lib/http.ts";
import { planWrites } from "../sync/lww.ts";
import { buildReply } from "../sync/reply.ts";
import { applySync, deleteAccount, fetchUpdatedAt } from "../sync/store.ts";
import { parseSyncRequest } from "../sync/validate.ts";

export const syncRoutes = new Hono<AppEnv>();

syncRoutes.post("/sync", requireUser, async (c) => {
  const request = parseSyncRequest(await readJson(c));
  if (!request) throw new ApiError("invalid");
  const userId = c.get("userId");
  const nowMs = Date.now();

  const existing = await fetchUpdatedAt(c.env.DB, userId, request.changes);
  const writes = planWrites(request.changes, existing, nowMs);
  const outcome = await applySync(c.env.DB, userId, request.cursor, writes, request.changes, nowMs);
  return c.json(buildReply({ requestCursor: request.cursor, ...outcome }));
});

syncRoutes.post("/account/delete", requireUser, async (c) => {
  const body = await readJson(c);
  if (!isRecord(body) || body.confirm !== true) throw new ApiError("invalid");
  await deleteAccount(c.env.DB, c.get("userId"));
  return c.json({ ok: true });
});
