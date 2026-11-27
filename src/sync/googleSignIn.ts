/* Google's sign-in button, loaded only when someone has to sign in. Google hands back an ID token for the account; the sync Worker
 * checks it with Google and answers with its own session token. The client secret is never involved.
 */
import { GOOGLE_CLIENT_ID } from "./config.ts";

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

interface GoogleId {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: "popup" }) => void;
  renderButton: (parent: HTMLElement, options: { theme: "outline" | "filled_blue" | "filled_black"; size: "large"; text: "continue_with"; shape: "pill"; width?: number; logo_alignment: "left" }) => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let loading: Promise<GoogleId> | null = null;

function loadGoogle(): Promise<GoogleId> {
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const ready = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error("Google sign-in did not load")));
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = ready;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google sign-in did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Draws Google's button into `parent`. `onToken` gets the ID token when the person picks an account. */
export async function showGoogleButton(parent: HTMLElement, onToken: (idToken: string) => void, width: number): Promise<void> {
  const google = await loadGoogle();
  google.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response) => onToken(response.credential), ux_mode: "popup" });
  google.renderButton(parent, { theme: "outline", size: "large", text: "continue_with", shape: "pill", width, logo_alignment: "left" });
}

/** So the next sign-in asks which account instead of picking the last one. */
export function forgetGoogleAccount(): void {
  window.google?.accounts.id.disableAutoSelect();
}
