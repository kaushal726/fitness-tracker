# EatRight sync API (contract between the app and the Worker)

One Cloudflare Worker + one D1 database. Free plan only. Everything is JSON. The app is served from other origins
(GitHub Pages now, Cloudflare later), so auth is a **Bearer token**, never a cookie, and CORS allows `ALLOWED_ORIGINS`.

Each person's data is the person's Google account (`sub`). The user id ALWAYS comes from the verified token, never from the request body.

## Auth

`POST /auth/google` body `{ "idToken": string }`
- Verify the Google ID token with `jose` `createRemoteJWKSet(https://www.googleapis.com/oauth2/v3/certs)`: issuer
  `https://accounts.google.com` or `accounts.google.com`, audience = env `GOOGLE_CLIENT_ID`, not expired, `email_verified === true`.
- Upsert `users` (`id` = Google `sub`, `email`, `name`, `picture`).
- Reply `{ "token": string, "user": { "id", "email", "name", "picture" } }`. `token` = our own HS256 JWT signed with secret
  `SESSION_SECRET`, claims `sub` and `exp` (60 days).

`POST /auth/refresh` (Bearer) -> `{ "token": string }` (a fresh 60 days; used each time the app opens).

`GET /me` (Bearer) -> `{ "user": {...} }`. 401 `{ "error": "unauthorized" }` for a missing, bad or expired token.

`POST /auth/dev` body `{ "email": string }` -> same reply as `/auth/google`, only when env `ALLOW_DEV_AUTH === "1"` (set in `.dev.vars` for
`wrangler dev`, NEVER in `wrangler.toml` [vars]); otherwise 404. The user id is `dev:<email>`.

## Sync

`POST /sync` (Bearer), body:
```json
{
  "cursor": 0,
  "changes": [
    { "kind": "entry", "id": "abc", "data": { }, "updatedAt": 1767000000000 },
    { "kind": "entry", "id": "xyz", "data": null, "updatedAt": 1767000000500 }
  ]
}
```
- `kind` is one of `entry`, `customFood`, `water`, `weight`, `favorite`, `lastUsed`, `doc`. For `doc`, `id` is one of `profile`, `settings`.
  For `water` and `weight` the `id` is the date `YYYY-MM-DD` and `data` is `{ "value": number }`. For `favorite` the `id` is a food id and `data` is
  `{ "at": number }`; for `lastUsed` the `id` is a food id and `data` is a small object. `data: null` means deleted (a tombstone is kept).
- `updatedAt` is the device clock in ms. The server clamps it to at most `now + 5 minutes` so a wrong clock can never win forever.
- Last write wins per record by `updatedAt`; a tie keeps what the server has. A stored tombstone loses to a newer edit and wins over an older one.
- Validation: at most 500 changes per request; `id` 1..200 chars; `data` is null or a JSON object whose serialized size is at most 20,000 bytes;
  unknown `kind` or doc id -> 400 `{ "error": "invalid" }` for the whole request (nothing applied).
- Every applied change gets the next per-user `seq` (a counter kept on the user row, increased atomically).

Reply:
```json
{
  "cursor": 1234,
  "more": false,
  "changes": [ { "kind": "entry", "id": "...", "data": { }, "updatedAt": 0, "seq": 1200 } ]
}
```
- `changes` = every record with `seq > cursor` (the request's `cursor`) that this request did NOT just write, plus any record of this request that
  LOST to a newer server version (so the app converges). At most 1,000 per reply; when there are more, `more: true` and the app calls again
  with the returned `cursor` and an empty `changes`.
- `cursor` = the highest `seq` the app now holds: after its own writes, and after the records returned. When `more` is false it equals the user's
  current `seq`, so an app that is up to date can send that back and get an empty reply.
- Deleted records come back with `data: null`.

`POST /account/delete` (Bearer), body `{ "confirm": true }` -> deletes every record and the user row. -> `{ "ok": true }`.

`GET /health` -> `{ "ok": true }` (no auth).

## D1 schema (migration `0001_init.sql`)

`users(id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT, picture TEXT, seq INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL)`

`records(user_id TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT, updated_at INTEGER NOT NULL, seq INTEGER NOT NULL, PRIMARY KEY(user_id, kind, id))` with an index on `(user_id, seq)`. `data` is NULL for a tombstone.

## Config (wrangler.toml `[vars]`, public) and secrets

`GOOGLE_CLIENT_ID` (public), `ALLOWED_ORIGINS` (comma list: `https://kaushal726.github.io,http://localhost:8790,http://[::1]:8790`; later also the Cloudflare app origin),
secret `SESSION_SECRET` (random, at least 32 bytes; set with `wrangler secret put`, never committed, never printed).
