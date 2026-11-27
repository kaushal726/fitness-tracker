/* Our own session: an HS256 JWT (claims sub + exp) sent as a Bearer token. No cookies, nothing stored server-side. */
import { jwtVerify, SignJWT } from "jose";
import { DAY_MS, MIN_SESSION_SECRET_BYTES, SESSION_DAYS } from "../constants.ts";
import type { Bindings } from "../env.ts";

const ALGORITHM = "HS256";

/** Thrown when SESSION_SECRET is missing or too short: a server problem, never the caller's. */
class SessionConfigError extends Error {}

function secretKey(env: Bindings): Uint8Array {
  const bytes = new TextEncoder().encode(env.SESSION_SECRET ?? "");
  if (bytes.length < MIN_SESSION_SECRET_BYTES) throw new SessionConfigError("SESSION_SECRET is not configured");
  return bytes;
}

export function issueSessionToken(env: Bindings, userId: string, nowMs: number = Date.now()): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt(Math.floor(nowMs / 1000))
    .setExpirationTime(Math.floor((nowMs + SESSION_DAYS * DAY_MS) / 1000))
    .sign(secretKey(env));
}

/** The user id inside a valid, unexpired token, or null for anything else. */
export async function verifySessionToken(env: Bindings, token: string, nowMs: number = Date.now()): Promise<string | null> {
  const key = secretKey(env);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [ALGORITHM], currentDate: new Date(nowMs) });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
