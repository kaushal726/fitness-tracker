/* Turning meal reminders on and off on this phone: the notification permission, the push subscription, and telling
 * the push server the times. Only the times (as minutes of the day) and the time zone are sent.
 */
import type { Reminders } from "../domain/reminders.ts";
import { reminderMinutes } from "../domain/reminders.ts";
import { PUSH_PUBLIC_KEY, PUSH_SERVER_URL } from "./pushConfig.ts";

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

/** Asks for permission if needed, subscribes this phone, and sends the times. Throws when any step fails. */
export async function startReminders(times: Reminders["times"]): Promise<void> {
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications are not allowed");
  const reg = await navigator.serviceWorker.ready;
  const subscription = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_PUBLIC_KEY) }));
  await post("/subscribe", { subscription: subscription.toJSON(), minutes: reminderMinutes(times), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

/** Stops the reminders on this phone and tells the server to forget it. */
export async function stopReminders(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;
  await post("/unsubscribe", { endpoint: subscription.endpoint }).catch(() => undefined);
  await subscription.unsubscribe();
}
