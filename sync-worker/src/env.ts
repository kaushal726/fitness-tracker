export interface Bindings {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  /** Comma-separated list of origins the app is served from. */
  ALLOWED_ORIGINS: string;
  /** Secret, at least 32 bytes. Never in wrangler.toml. */
  SESSION_SECRET: string;
  /** "1" only in .dev.vars, never in wrangler.toml. Turns on POST /auth/dev. */
  ALLOW_DEV_AUTH?: string;
}

export interface Variables {
  userId: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}
