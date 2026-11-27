import type { PublicUser } from "../env.ts";

/** Creates the user, or refreshes their profile and last_seen. */
export async function upsertUser(db: D1Database, profile: PublicUser, nowMs: number): Promise<PublicUser> {
  const row = await db
    .prepare(
      `INSERT INTO users (id, email, name, picture, created_at, last_seen) VALUES (?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT (id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_seen = excluded.last_seen
       RETURNING id, email, name, picture`,
    )
    .bind(profile.id, profile.email, profile.name, profile.picture, nowMs)
    .first<PublicUser>();
  if (!row) throw new Error("User upsert returned nothing");
  return row;
}

export function findUser(db: D1Database, userId: string): Promise<PublicUser | null> {
  return db.prepare("SELECT id, email, name, picture FROM users WHERE id = ?1").bind(userId).first<PublicUser>();
}
