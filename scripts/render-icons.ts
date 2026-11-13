/* Renders the app's PNG icons from public/icons/icon.svg (and the notification badge from scripts/badge.svg) with
 * headless Chrome. Run it after changing either SVG: `npm run icons`.
 * Set CHROME to the browser binary when it is not at the usual macOS path.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ICONS = resolve(import.meta.dirname, "../public/icons");
const SOURCES = { "icon.svg": ICONS, "badge.svg": import.meta.dirname };
/** Corner radius of the rounded ("any") icons, as a share of their size. */
const CORNER = 0.225;

interface Target {
  file: string;
  source: "icon.svg" | "badge.svg";
  size: number;
  /** Rounded corners for icons shown as they are; launchers, iOS and notifications cut their own shape from a full-bleed square. */
  rounded: boolean;
}

const TARGETS: Target[] = [
  { file: "icon-192.png", source: "icon.svg", size: 192, rounded: true },
  { file: "icon-512.png", source: "icon.svg", size: 512, rounded: true },
  { file: "icon-maskable-512.png", source: "icon.svg", size: 512, rounded: false },
  { file: "apple-touch-icon.png", source: "icon.svg", size: 180, rounded: false },
  { file: "notification-192.png", source: "icon.svg", size: 192, rounded: false },
  { file: "badge-96.png", source: "badge.svg", size: 96, rounded: false },
];

function page({ source, size, rounded }: Target): string {
  const radius = rounded ? Math.round(size * CORNER) : 0;
  const src = pathToFileURL(join(SOURCES[source], source)).href;
  return `<!doctype html><html><body style="margin:0;background:transparent">` +
    `<img src="${src}" width="${size}" height="${size}" style="display:block;border-radius:${radius}px"></body></html>`;
}

const work = mkdtempSync(join(tmpdir(), "icons-"));
try {
  for (const target of TARGETS) {
    const html = join(work, `${target.file}.html`);
    writeFileSync(html, page(target));
    execFileSync(CHROME, [
      "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
      "--default-background-color=00000000", `--window-size=${target.size},${target.size}`,
      `--screenshot=${join(ICONS, target.file)}`, pathToFileURL(html).href,
    ], { stdio: "ignore" });
    console.log(`${target.file} (${target.size}px)`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
