/* EatRight meal reminders: a tiny push server on Cloudflare Workers (free plan).
 *
 * The app sends its push subscription, its time zone and up to four minutes of the day. Every five minutes a cron
 * looks for reminders that fall in the last five minutes, in each subscriber's own time zone, and sends an empty push.
 * The app's service worker then shows the notification and picks the meal from its own settings, so no food, name
 * or meal ever reaches this server. A subscription the push service says is gone is deleted.
 *
 * Storage: one KV entry per phone, keyed by a hash of its push endpoint.
 * Secrets: VAPID_PRIVATE_JWK (wrangler secret). Vars: VAPID_PUBLIC_KEY, VAPID_SUBJECT, ALLOWED_ORIGINS.
 */

const MINUTES_IN_DAY = 1440;
/** How often the cron runs, in minutes: a reminder is sent on the first run at or after its minute. */
const WINDOW_MINUTES = 5;
const MAX_REMINDERS = 4;
/** A reminder that cannot be delivered within this many seconds is dropped, not delivered late. */
const PUSH_TTL_SECONDS = 1800;
const JWT_HOURS = 12;
const SUB_PREFIX = "sub:";

const encoder = new TextEncoder();

function base64url(bytes) {
  const raw = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let s = "";
  for (const b of raw) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function validTimeZone(tz) {
  if (typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Checks what the app sent; returns the record to keep, or null. */
function parseSubscription(body) {
  const sub = body?.subscription;
  const minutes = body?.minutes;
  if (!sub || typeof sub.endpoint !== "string" || !sub.endpoint.startsWith("https://") || sub.endpoint.length > 1024) return null;
  if (!Array.isArray(minutes) || minutes.length > MAX_REMINDERS) return null;
  if (!minutes.every((m) => Number.isInteger(m) && m >= 0 && m < MINUTES_IN_DAY)) return null;
  if (!validTimeZone(body.timeZone)) return null;
  return { endpoint: sub.endpoint, minutes, timeZone: body.timeZone };
}

async function handleFetch(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const { pathname } = new URL(request.url);
  if (request.method === "GET" && pathname === "/") return json({ ok: true, publicKey: env.VAPID_PUBLIC_KEY }, 200, cors);
  if (request.method !== "POST") return json({ error: "Not found" }, 404, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400, cors);
  }

  if (pathname === "/subscribe") {
    const record = parseSubscription(body);
    if (!record) return json({ error: "Bad request" }, 400, cors);
    await env.SUBSCRIPTIONS.put(SUB_PREFIX + (await sha256Hex(record.endpoint)), JSON.stringify(record));
    return json({ ok: true }, 200, cors);
  }
  if (pathname === "/unsubscribe") {
    const endpoint = body?.endpoint;
    if (typeof endpoint !== "string") return json({ error: "Bad request" }, 400, cors);
    await env.SUBSCRIPTIONS.delete(SUB_PREFIX + (await sha256Hex(endpoint)));
    return json({ ok: true }, 200, cors);
  }
  return json({ error: "Not found" }, 404, cors);
}

/** The minute of the day it is now in a time zone. */
function minuteIn(timeZone, now) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** Whether a reminder's minute fell in the window that ends now. */
function isDue(minutes, nowMinute) {
  return minutes.some((m) => (nowMinute - m + MINUTES_IN_DAY) % MINUTES_IN_DAY < WINDOW_MINUTES);
}

let signingKey = null;
async function vapidAuthorization(endpoint, env) {
  signingKey ??= await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE_JWK), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = base64url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + JWT_HOURS * 3600, sub: env.VAPID_SUBJECT };
  const payload = base64url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, encoder.encode(`${header}.${payload}`));
  return `vapid t=${header}.${payload}.${base64url(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}

/** An empty push: the service worker on the phone works out what to say. Returns false when the subscription is gone. */
async function sendPush(endpoint, env) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { TTL: String(PUSH_TTL_SECONDS), Urgency: "high", Authorization: await vapidAuthorization(endpoint, env), "Content-Length": "0" },
  });
  return !(res.status === 404 || res.status === 410);
}

async function handleScheduled(env) {
  const now = new Date();
  let cursor;
  do {
    const page = await env.SUBSCRIPTIONS.list({ prefix: SUB_PREFIX, cursor });
    for (const { name } of page.keys) {
      const record = await env.SUBSCRIPTIONS.get(name, "json");
      if (!record || !isDue(record.minutes, minuteIn(record.timeZone, now))) continue;
      try {
        if (!(await sendPush(record.endpoint, env))) await env.SUBSCRIPTIONS.delete(name);
      } catch (err) {
        console.warn("Push failed", err);
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

export default {
  fetch: handleFetch,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },
};
