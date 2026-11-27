# EatRight sync Worker

The backend for EatRight's account sync: one Cloudflare Worker + one D1 database, free plan only.
The API is defined in [CONTRACT.md](./CONTRACT.md) (the app and this Worker both follow it).

- Hono router, `jose` for the Google ID token and our own HS256 session token (Bearer, no cookies).
- Sync logic is split into pure functions (`src/sync/validate.ts`, `lww.ts`, `reply.ts`) and one thin D1 layer (`src/sync/store.ts`).
- A `/sync` request is atomic: one `DB.batch` writes the applied changes, raises `users.seq` by their count and reads back what the app is missing.
  Rows travel as one JSON parameter read with `json_each`, so a 500-change request is a handful of statements (free plan: 50 per invocation, 100 bound parameters per statement).

## Run locally

```sh
cd sync-worker
npm install
cp .dev.vars.example .dev.vars   # or create it by hand, see below
npm run db:migrate:local         # applies migrations/ to the local D1 under .wrangler/
npm run dev                      # wrangler dev --local on http://localhost:8788
```

`.dev.vars` (gitignored, local only, never real secrets):

```
SESSION_SECRET=<any random string of 32+ characters>
ALLOW_DEV_AUTH=1
GOOGLE_CLIENT_ID=dev-placeholder-client-id
```

`ALLOW_DEV_AUTH=1` turns on `POST /auth/dev` (sign in as any email, no Google). It must never go in `wrangler.toml`.

## Tests and smoke

```sh
npm run typecheck
npm test          # vitest; runs the real Hono app and the real SQL on node:sqlite (Node 22+), no Cloudflare needed
npm run smoke     # needs `npm run dev` running in another terminal; signs in via /auth/dev and runs sync end to end
                  # with two devices on one account, pagination, LWW, tombstones, isolation and account delete
```

## Deploy later (checklist for the owner, run on your own Cloudflare account)

1. `npx wrangler login`
2. `npx wrangler d1 create eatright-sync`, then paste the printed `database_id` into `wrangler.toml` (replace `REPLACE_AFTER_d1_create`).
3. `npm run db:migrate:remote`
4. `npx wrangler secret put SESSION_SECRET` (a random string, at least 32 bytes, e.g. `openssl rand -hex 32`)
5. Set `GOOGLE_CLIENT_ID` in `wrangler.toml` `[vars]` (the Web OAuth client id from Google Cloud Console) and check `ALLOWED_ORIGINS`
   (add the Cloudflare app origin when there is one).
6. `npx wrangler deploy`
7. Check `https://eatright-sync.<your-subdomain>.workers.dev/health` returns `{"ok":true}`.

## Notes

- Errors are always `{ "error": "unauthorized" | "invalid" | "not_found" | "server" }`, never naming a record or user.
- Every query is scoped by the user id from the verified token; the body is never trusted for it.
- A reply that is paginated (`more: true`) can echo the app's own just-written records on a later page; they are identical to what the app holds.
