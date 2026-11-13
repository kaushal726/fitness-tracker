/* Service worker, generated at build time by vite-plugins/serviceWorker.ts.
 * Precaches the whole app so it opens offline. A new build installs in the background and
 * takes over when the user taps "Reload" (the page posts SKIP_WAITING). The page itself is fetched network-first.
 * Everything lives in IndexedDB on the device, so there is nothing else to fetch.
 */
const CACHE_NAME = "fitly-app-__CACHE_VERSION__";
const PRECACHE = __PRECACHE_LIST__;
const INDEX_URL = "./index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fitly-") && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ignoreVary: module scripts send an Origin header; a server's "Vary: Origin" must not cause a miss offline.
const MATCH = { ignoreSearch: true, ignoreVary: true };

/** How long a page load waits for the network before it opens the copy kept here. */
const NAVIGATION_TIMEOUT_MS = 3500;

/**
 * The page itself comes from the network first, so it always names the files of the build that is live. Served from
 * the cache, an old page could ask for files a new deploy has already replaced while a new service worker takes over
 * mid-load, and the app would open blank. Offline, or on a network too slow to answer, the kept copy opens instead.
 */
function openPage(req) {
  const network = fetch(req).then((res) => {
    if (!res.ok) throw new Error("The page did not load");
    return res;
  });
  const slow = new Promise((_, reject) => setTimeout(() => reject(new Error("Slow network")), NAVIGATION_TIMEOUT_MS));
  return Promise.race([network, slow]).catch(() => caches.match(INDEX_URL, MATCH).then((cached) => cached || network));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(openPage(req));
    return;
  }
  event.respondWith(caches.match(req, MATCH).then((cached) => cached || fetch(req)));
});

/* Reminders. The push server (push-worker/) sends an empty push at each reminder minute. What it is for is read here
 * from the list the app keeps on the phone (kv "reminderPlan", made by src/domain/reminders.ts), so nothing about food
 * ever leaves it. Phones that saved reminders before that list existed fall back to the meal times in the settings.
 */
const MEAL_LABELS = { breakfast: "breakfast", lunch: "lunch", snack: "snack", dinner: "dinner" };
const DEFAULT_MEAL_HOURS = { breakfast: 8.5, lunch: 13.5, snack: 17, dinner: 20.5 };
const MINUTES_IN_DAY = 1440;

function readKv(keys) {
  return new Promise((resolve) => {
    const open = indexedDB.open("fitly");
    open.onerror = () => resolve({});
    open.onsuccess = () => {
      const db = open.result;
      const out = {};
      try {
        const store = db.transaction("kv").objectStore("kv");
        keys.forEach((key) => {
          const req = store.get(key);
          req.onsuccess = () => (out[key] = req.result);
        });
        store.transaction.oncomplete = () => {
          db.close();
          resolve(out);
        };
        store.transaction.onerror = () => {
          db.close();
          resolve(out);
        };
      } catch {
        db.close();
        resolve(out);
      }
    };
  });
}

/** The planned reminder nearest to now. */
function reminderNow(plan) {
  const now = new Date();
  const minute = now.getHours() * 60 + now.getMinutes();
  const distance = (r) => {
    const d = Math.abs(minute - r.minute);
    return Math.min(d, MINUTES_IN_DAY - d);
  };
  return plan.reduce((best, r) => (distance(r) < distance(best) ? r : best));
}

function planFrom(kv) {
  if (Array.isArray(kv.reminderPlan) && kv.reminderPlan.length) return kv.reminderPlan;
  const hours = kv.settings?.reminders?.times ?? DEFAULT_MEAL_HOURS;
  return Object.keys(MEAL_LABELS).map((meal) => ({ minute: Math.round((hours[meal] ?? DEFAULT_MEAL_HOURS[meal]) * 60), kind: "meal", meal }));
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    readKv(["reminderPlan", "settings"]).then((kv) => {
      const reminder = reminderNow(planFrom(kv));
      const water = reminder.kind === "water";
      return self.registration.showNotification(water ? "Time for a glass of water" : `Time to log your ${MEAL_LABELS[reminder.meal] ?? "meal"}`, {
        body: water ? "A glass now keeps you on track. Tap to log it." : "Tap to add what you ate.",
        // A full-bleed square: Android cuts its own shape, so transparent corners would show as white patches.
        icon: "./icons/notification-192.png",
        // The status bar uses only the badge's alpha, so it is a one-colour silhouette.
        badge: "./icons/badge-96.png",
        tag: water ? "water-reminder" : "meal-reminder",
        data: { kind: reminder.kind },
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.registration.scope));
      return open ? open.focus() : self.clients.openWindow(self.registration.scope);
    }),
  );
});
