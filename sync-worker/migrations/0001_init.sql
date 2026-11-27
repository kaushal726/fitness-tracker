-- EatRight sync schema (Cloudflare D1 / SQLite). Timestamps are epoch milliseconds.
-- users.seq is the per-user change counter: every applied change takes the next value.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

-- data is the record as JSON text; NULL is a tombstone (the record was deleted).
CREATE TABLE records (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT,
  updated_at INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, id)
);
CREATE INDEX idx_records_user_seq ON records (user_id, seq);
