/* Turning reminders on and off on this phone: the notification permission, the push subscription, and telling the push
 * server the minutes. Only the minutes of the day and the time zone are sent; what each one is for stays on the phone,
 * in the list the service worker reads.
 */
import { setValue } from "../data/db.ts";
import type { PlannedReminder } from "../domain/reminders.ts";
import { PUSH_PUBLIC_KEY, PUSH_SERVER_URL } from "./pushConfig.ts";

/** Where the day's reminders are kept for the service worker (vite-plugins/sw-template.js reads the same key). */
const PLAN_KEY = "reminderPlan";

export type ReminderSupport = "ready" | "not-set-up" | "unsupported" | "install-first" | "blocked";

const isStandalone = (): boolean => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent);

/** Whether reminders can work here, and if not, why. */
export function reminderSupport(): ReminderSupport {
  if (!PUSH_SERVER_URL || !PUSH_PUBLIC_KEY) return "not-set-up";
  // An iPhone only lets a web app send notifications once it is on the Home Screen.
  if (isIOS() && !isStandalone()) return "install-first";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return "ready";
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${PUSH_SERVER_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("The reminder server did not accept it");
}

/** Keeps the day's reminders where the service worker reads them. Cheap, so the app redoes it whenever settings change. */
export function saveReminderPlan(plan: PlannedReminder[]): Promise<void> {
  return setValue(PLAN_KEY, plan);
}

/**
 * Puts this phone's reminders in line with the plan: with any reminder on, asks for permission if needed, subscribes and
 * sends the minutes; with none, stops them. Throws when a step fails.
 */
export async function syncReminders(plan: PlannedReminder[]): Promise<void> {
  if (plan.length === 0) {
    await stopReminders();
    await saveReminderPlan(plan);
    return;
  }
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications are not allowed");
  const reg = await navigator.serviceWorker.ready;
  const subscription = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_PUBLIC_KEY) }));
  await saveReminderPlan(plan);
  await post("/subscribe", { subscription: subscription.toJSON(), minutes: plan.map((r) => r.minute), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

/** Stops the reminders on this phone and tells the server to forget it. */
async function stopReminders(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;
  await post("/unsubscribe", { endpoint: subscription.endpoint }).catch(() => undefined);
  await subscription.unsubscribe();
}

