/* Product name and web-app manifest — the single place to rename the app.
 * The app was first called Fitly, so a few internal identifiers still say "fitly": the IndexedDB name
 * (src/data/db.ts), the theme key (src/app/theme.ts, index.html), the backup format marker
 * (src/data/types.ts) and the service-worker cache prefix (vite-plugins/sw-template.js).
 * Nobody ever sees them, and they must not change once the app is installed: renaming them
 * would orphan the data already on a phone.
 */
export const APP_NAME = "EatRight";
export const APP_CREDIT = "Made with love from Kaushal";

export const THEME_COLOR = "#F4F6F5";
/** Matches --bg under [data-theme="dark"] in src/styles/global.css. */
export const THEME_COLOR_DARK = "#0E1211";
/** The icon's own background. */
export const BRAND_COLOR = "#1F6F54";

export const WEB_MANIFEST = {
  name: APP_NAME,
  short_name: APP_NAME,
  description: "Log what you eat in two taps and see how the day is going. Works offline, and your data stays on your phone.",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "any",
  background_color: BRAND_COLOR,
  theme_color: BRAND_COLOR,
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
