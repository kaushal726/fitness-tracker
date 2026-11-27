/* Where the cloud copy lives and which Google client signs people in. Both are public values (they are in the page anyway).
 * The VITE_* variables override them for local testing. If either is ever set back to a REPLACE placeholder the app does not ask
 * anyone to sign in and keeps working on the phone alone.
 */
const PLACEHOLDER = "REPLACE";

const fromEnv = (name: "VITE_SYNC_API_URL" | "VITE_GOOGLE_CLIENT_ID"): string | undefined => {
  const value = import.meta.env[name] as string | undefined;
  return value && value.length > 0 ? value : undefined;
};

/** The sync Worker, without a trailing slash. */
export const SYNC_API_URL: string = (fromEnv("VITE_SYNC_API_URL") ?? "https://eatright-sync.eatright-reminders.workers.dev").replace(/\/$/, "");
/** Google Cloud Console > APIs and Services > Credentials > OAuth client ID (Web). The client secret is never needed here. */
export const GOOGLE_CLIENT_ID: string = fromEnv("VITE_GOOGLE_CLIENT_ID") ?? "521678096514-gf083p8slvoek28ha0pgsc7ol2sqh790.apps.googleusercontent.com";

export const syncConfigured = (): boolean => !SYNC_API_URL.startsWith(PLACEHOLDER) && !GOOGLE_CLIENT_ID.startsWith(PLACEHOLDER);

/** Signing in without Google is only offered while building locally against a Worker on this computer. */
export const devSignInAllowed = (): boolean => import.meta.env.DEV && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(SYNC_API_URL);
