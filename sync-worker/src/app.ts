import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GoogleVerifier } from "./auth/google.ts";
import { CORS_MAX_AGE_SECONDS } from "./constants.ts";
import type { AppEnv } from "./env.ts";
import { ApiError, type ErrorCode } from "./lib/http.ts";
import { authRoutes } from "./routes/auth.ts";
import { syncRoutes } from "./routes/sync.ts";

const splitOrigins = (list: string | undefined): string[] =>
  (list ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export function createApp(verifyGoogle?: GoogleVerifier): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Bearer tokens only: no cookies, so credentials are never allowed and only listed origins are echoed back.
  app.use(
    "*",
    cors({
      origin: (origin, c) => (splitOrigins(c.env.ALLOWED_ORIGINS).includes(origin) ? origin : null),
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      maxAge: CORS_MAX_AGE_SECONDS,
    }),
  );
  app.use("*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/", authRoutes(verifyGoogle));
  app.route("/", syncRoutes);

  app.notFound((c) => c.json({ error: "not_found" satisfies ErrorCode }, 404));
  app.onError((err, c) => {
    if (err instanceof ApiError) return c.json({ error: err.code }, err.status);
    // The error name only: messages could carry user data or secrets.
    console.error("unhandled error", err.name);
    return c.json({ error: "server" satisfies ErrorCode }, 500);
  });

  return app;
}
