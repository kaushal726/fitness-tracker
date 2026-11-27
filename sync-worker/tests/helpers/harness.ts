import { createApp } from "../../src/app.ts";
import type { Bindings } from "../../src/env.ts";
import type { GoogleVerifier } from "../../src/auth/google.ts";
import type { IncomingChange, SyncReply } from "../../src/sync/types.ts";
import { SqliteD1 } from "./sqliteD1.ts";

export const ORIGIN = "https://kaushal726.github.io";

export interface TestWorld {
  db: SqliteD1;
  env: Bindings;
  /** Calls the Worker in-process, the way the runtime would. */
  fetch: (path: string, init?: { method?: string; token?: string; body?: unknown; origin?: string; rawBody?: string }) => Promise<Response>;
}

export function makeWorld(options: { verifyGoogle?: GoogleVerifier; devAuth?: boolean } = {}): TestWorld {
  const db = new SqliteD1();
  const env = {
    DB: db as unknown as D1Database,
    GOOGLE_CLIENT_ID: "test-client-id",
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8790,http://[::1]:8790`,
    SESSION_SECRET: "test-secret-test-secret-test-secret-0123",
    ALLOW_DEV_AUTH: options.devAuth === false ? undefined : "1",
  } satisfies Bindings;
  const app = createApp(options.verifyGoogle);
  return {
    db,
    env,
    fetch: (path, { method = "POST", token, body, origin, rawBody } = {}) =>
      Promise.resolve(
        app.request(
          path,
          {
            method,
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(origin ? { Origin: origin } : {}),
              ...(body !== undefined || rawBody !== undefined ? { "Content-Type": "application/json" } : {}),
            },
            body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
          },
          env,
        ),
      ),
  };
}

/** One device: a signed-in client with its own sync cursor. Two devices of one account share the email. */
export class Device {
  cursor = 0;
  readonly world: TestWorld;
  readonly token: string;

  constructor(world: TestWorld, token: string) {
    this.world = world;
    this.token = token;
  }

  static async signIn(world: TestWorld, email: string): Promise<Device> {
    const res = await world.fetch("/auth/dev", { body: { email } });
    const { token } = (await res.json()) as { token: string };
    return new Device(world, token);
  }

  async sync(changes: IncomingChange[] = [], cursor: number = this.cursor): Promise<SyncReply> {
    const res = await this.world.fetch("/sync", { token: this.token, body: { cursor, changes } });
    if (res.status !== 200) throw new Error(`sync failed with ${res.status}`);
    const reply = (await res.json()) as SyncReply;
    this.cursor = reply.cursor;
    return reply;
  }
}

export const entry = (id: string, updatedAt: number, data: Record<string, unknown> | null = { name: id }): IncomingChange => ({ kind: "entry", id, data, updatedAt });
