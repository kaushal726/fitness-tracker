/* Service worker, generated at build time by vite-plugins/serviceWorker.ts.
 * Precaches the whole app so it opens offline. A new build installs in the background and
 * takes over when the user taps "Reload" (the page posts SKIP_WAITING).
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(caches.match(INDEX_URL, MATCH).then((cached) => cached || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, MATCH).then((cached) => cached || fetch(req)));
});

/* Meal reminders. The push server (push-worker/) sends an empty push at each reminder time; the meal is worked out
 * here from the reminder times saved on the phone, so nothing about food ever leaves it. Keep these in step with
 * src/domain/reminders.ts and src/domain/meals.ts.
 */
const MEALS = [
  { id: "breakfast", label: "breakfast" },
  { id: "lunch", label: "lunch" },
  { id: "snack", label: "snack" },
  { id: "dinner", label: "dinner" },
];
const DEFAULT_REMINDER_HOURS = { breakfast: 8.5, lunch: 13.5, snack: 17, dinner: 20.5 };
const MINUTES_IN_DAY = 1440;

function readSettings() {
  return new Promise((resolve) => {
    const open = indexedDB.open("fitly");
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      try {
        const req = open.result.transaction("kv").objectStore("kv").get("settings");
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
  });
}

/** The meal whose reminder time is nearest to now. */
function mealNow(hours) {
  const now = new Date();
  const minute = now.getHours() * 60 + now.getMinutes();
  const distance = (m) => {
    const d = Math.abs(minute - Math.round((hours[m.id] ?? DEFAULT_REMINDER_HOURS[m.id]) * 60));
    return Math.min(d, MINUTES_IN_DAY - d);
  };
  return MEALS.reduce((best, m) => (distance(m) < distance(best) ? m : best));
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    readSettings().then((settings) => {
      const meal = mealNow(settings?.reminders?.times ?? DEFAULT_REMINDER_HOURS);
      return self.registration.showNotification(`Time to log your ${meal.label}`, {
        body: "Tap to add what you ate.",
        icon: "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag: "meal-reminder",
        data: { meal: meal.id },
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
