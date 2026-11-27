// End-to-end check against `wrangler dev --local` (real local D1, ALLOW_DEV_AUTH=1 in .dev.vars).
// Usage: node scripts/smoke.mjs [baseUrl]   — exits non-zero on the first failed check.
const BASE = process.argv[2] ?? "http://localhost:8788";
const ORIGIN = "http://localhost:8790";
const RUN = Date.now().toString(36);
const T0 = Date.now() - 3_600_000;

function ok(condition, label, detail) {
  if (!condition) {
    console.error(`FAIL ${label}`, detail === undefined ? "" : JSON.stringify(detail).slice(0, 300));
    process.exit(1);
  }
  console.log(`ok   ${label}`);
}

async function call(method, path, { token, body, origin = ORIGIN } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Origin: origin, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, headers: res.headers, body: res.status === 204 ? null : await res.json() };
}

/** One device: a client with its own token and cursor. */
class Device {
  cursor = 0;
  constructor(token) {
    this.token = token;
  }
  static async signIn(email) {
    const r = await call("POST", "/auth/dev", { body: { email } });
    ok(r.status === 200 && typeof r.body.token === "string", `signs in as ${email.split("@")[0]}`, r.body);
    return new Device(r.body.token);
  }
  async sync(changes = []) {
    const r = await call("POST", "/sync", { token: this.token, body: { cursor: this.cursor, changes } });
    if (r.status !== 200) return ok(false, "sync returned 200", r);
    this.cursor = r.body.cursor;
    return r.body;
  }
}

const change = (kind, id, data, updatedAt) => ({ kind, id, data, updatedAt });
const emailA = `alice-${RUN}@smoke.test`;
const emailB = `bob-${RUN}@smoke.test`;

// Basics, CORS, auth
let r = await call("GET", "/health");
ok(r.status === 200 && r.body.ok === true, "GET /health");
r = await call("OPTIONS", "/sync");
ok(r.status === 204 && r.headers.get("access-control-allow-origin") === ORIGIN, "preflight is 204 and echoes the allowed origin");
r = await call("GET", "/health", { origin: "https://evil.example" });
ok(r.headers.get("access-control-allow-origin") === null, "an unlisted origin gets no CORS header");
r = await call("POST", "/sync", { body: { cursor: 0, changes: [] } });
ok(r.status === 401 && r.body.error === "unauthorized", "sync without a token is 401");
r = await call("POST", "/sync", { token: "not.a.token", body: { cursor: 0, changes: [] } });
ok(r.status === 401, "sync with a bad token is 401");

// Two devices, one account
const phone = await Device.signIn(emailA);
const laptop = await Device.signIn(emailA);
r = await call("GET", "/me", { token: phone.token });
ok(r.status === 200 && r.body.user.email === emailA, "GET /me", r.body);
r = await call("POST", "/auth/refresh", { token: phone.token, body: {} });
ok(r.status === 200 && typeof r.body.token === "string", "refresh gives a new token");
r = await call("GET", "/me", { token: r.body.token });
ok(r.status === 200, "the refreshed token works");

const many = Array.from({ length: 300 }, (_, i) => change("entry", `e${i}`, { name: `meal ${i}` }, T0 + i));
let reply = await phone.sync([...many, change("doc", "profile", { goal: 2000 }, T0), change("water", "2026-11-27", { value: 1200 }, T0), change("favorite", "food-1", { at: T0 }, T0), change("lastUsed", "food-1", { qty: 2 }, T0)]);
ok(reply.cursor === 304 && reply.changes.length === 0 && reply.more === false, "first sync of 304 records", { cursor: reply.cursor, n: reply.changes.length });

reply = await laptop.sync();
ok(reply.changes.length === 304 && reply.cursor === 304 && !reply.more, "second device pulls all 304", { n: reply.changes.length });
ok(reply.changes.some((c) => c.kind === "doc" && c.id === "profile" && c.data.goal === 2000), "doc and other kinds arrive intact");

// A newer edit wins and reaches the other device
reply = await laptop.sync([change("entry", "e1", { name: "edited on laptop" }, T0 + 10_000)]);
ok(reply.changes.length === 0 && reply.cursor === 305, "laptop edit applied", reply);
reply = await phone.sync();
ok(reply.changes.length === 1 && reply.changes[0].data.name === "edited on laptop", "phone sees the newer edit", reply);

// An older edit loses and the server copy comes back
reply = await phone.sync([change("entry", "e1", { name: "stale phone edit" }, T0 + 5)]);
ok(reply.changes.length === 1 && reply.changes[0].data.name === "edited on laptop", "older edit loses and the winner is returned", reply);

// Tombstone vs edit
reply = await phone.sync([change("entry", "e2", null, T0 + 20_000)]);
ok(reply.changes.length === 0, "tombstone applied");
reply = await laptop.sync([change("entry", "e2", { name: "older than the delete" }, T0 + 15_000)]);
ok(reply.changes.some((c) => c.id === "e2" && c.data === null), "tombstone beats an older edit and comes back as data null", reply);
reply = await laptop.sync([change("entry", "e2", { name: "revived" }, T0 + 30_000)]);
reply = await phone.sync();
ok(reply.changes.some((c) => c.id === "e2" && c.data?.name === "revived"), "a newer edit beats the tombstone", reply);

// Clamped future updatedAt: it cannot lock the record
const farFuture = Date.now() + 10 * 365 * 86_400_000;
await phone.sync([change("entry", "clock", { v: "future" }, farFuture)]);
reply = await laptop.sync([change("entry", "clock", { v: "normal" }, Date.now() + 10 * 60_000)]);
ok(reply.changes.length === 0, "an edit stamped after the clamp (now + 10 min) beats a wrong-clock record");

// Pagination: more than 1,000 records
const bulk = Array.from({ length: 1_100 }, (_, i) => change("customFood", `cf${i}`, { n: i }, T0 + i));
for (let start = 0; start < bulk.length; start += 500) await phone.sync(bulk.slice(start, start + 500));
const fresh = await Device.signIn(emailA);
const page1 = await fresh.sync();
ok(page1.more === true && page1.changes.length === 1000, "first page has 1,000 records and more=true", { more: page1.more, n: page1.changes.length });
let pulled = page1.changes.length;
for (let guard = 0; guard < 5; guard += 1) {
  const page = await fresh.sync();
  pulled += page.changes.length;
  if (!page.more) break;
}
const final = await fresh.sync();
ok(final.changes.length === 0 && final.more === false, "up to date: an empty reply");
ok(pulled >= 1_100, "the pages add up to every record", { pulled });

// Invalid input rejected whole
const before = (await phone.sync()).cursor;
r = await call("POST", "/sync", { token: phone.token, body: { cursor: 0, changes: [change("entry", "fine", {}, T0), change("nope", "x", {}, T0)] } });
ok(r.status === 400 && r.body.error === "invalid", "an unknown kind rejects the whole request");
r = await call("POST", "/sync", { token: phone.token, body: { cursor: 0, changes: [change("doc", "favorites", {}, T0)] } });
ok(r.status === 400, "an unknown doc id is rejected");
ok((await phone.sync()).cursor === before, "nothing from the rejected requests was applied");

// Isolation between accounts
const bob = await Device.signIn(emailB);
reply = await bob.sync();
ok(reply.changes.length === 0 && reply.cursor === 0, "another account sees none of Alice's records");
reply = await bob.sync([change("entry", "e1", { name: "bob's own" }, T0 + 999_999)]);
reply = await laptop.sync();
ok(!reply.changes.some((c) => c.data?.name === "bob's own"), "Bob's write never reaches Alice");

// Account delete
r = await call("POST", "/account/delete", { token: bob.token, body: {} });
ok(r.status === 400, "delete without confirm is rejected");
r = await call("POST", "/account/delete", { token: bob.token, body: { confirm: true } });
ok(r.status === 200 && r.body.ok === true, "account delete");
r = await call("GET", "/me", { token: bob.token });
ok(r.status === 401, "the deleted account's token stops working");
const alice = await Device.signIn(emailA);
ok((await alice.sync()).changes.length > 0, "Alice's data is untouched by Bob's delete");

console.log("\nsmoke: all checks passed");
