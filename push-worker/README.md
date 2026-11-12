# EatRight meal reminders (push server)

A small Cloudflare Worker (free plan) that sends the meal reminders. The app sends it a push subscription, a time zone and
four minutes of the day; a cron runs every five minutes and sends an empty push to every phone with a reminder in the
last five minutes. The app's service worker shows the notification and works out the meal itself, so no food ever
leaves the phone.

## First setup

From this folder:

1. Make the VAPID keys, keeping the private one outside the repo:
   `node scripts/make-vapid.mjs ~/eatright-vapid-private.json` prints the public key.
2. `npx wrangler login`
3. `npx wrangler kv namespace create SUBSCRIPTIONS`, then put the id it prints in `wrangler.toml`.
4. Put the public key in `wrangler.toml` (`VAPID_PUBLIC_KEY`).
5. `npx wrangler secret put VAPID_PRIVATE_JWK < ~/eatright-vapid-private.json`
6. `npx wrangler deploy`, which prints the worker's URL.
7. Put the URL and the public key in `src/app/pushConfig.ts`, then build and deploy the app.

Turn reminders on in the app: Profile, Meal reminders. On an iPhone the app has to be on the Home Screen first.

## Changing it later

`npx wrangler deploy` after editing `src/index.js`. A new key pair means every phone has to turn reminders on again.
