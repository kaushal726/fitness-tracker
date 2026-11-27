import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { MAX_BODY_BYTES } from "../constants.ts";
import type { AppEnv } from "../env.ts";

/** The only messages the API ever sends. They never name a record, a user or a field. */
export type ErrorCode = "unauthorized" | "invalid" | "not_found" | "server";

const STATUS: Record<ErrorCode, ContentfulStatusCode> = { unauthorized: 401, invalid: 400, not_found: 404, server: 500 };

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: ContentfulStatusCode;
  constructor(code: ErrorCode) {
    super(code);
    this.code = code;
    this.status = STATUS[code];
  }
}

/** Reads the request body as JSON. Anything unreadable or too big is `invalid`. */
export async function readJson(c: Context<AppEnv>): Promise<unknown> {
  const declared = Number(c.req.header("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new ApiError("invalid");
  const text = await c.req.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError("invalid");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("invalid");
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
