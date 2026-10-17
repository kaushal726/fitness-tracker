import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCENT_KEY, ACCENTS, DEFAULT_ACCENT, type AccentId } from "./accent.ts";

const tokens = fs.readFileSync(fileURLToPath(new URL("../styles/tokens.css", import.meta.url)), "utf8");
const MIN_TEXT_CONTRAST = 4.5;
const LIGHT_SET = ":root";
const DARK_SET = ':root[data-theme="dark"]';

/** The custom properties declared in the rule with exactly this selector. */
function declared(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(tokens);
  if (!rule) throw new Error(`No rule for ${selector}`);
  return Object.fromEntries([...rule[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

const sets = (id: AccentId): { light: Record<string, string>; dark: Record<string, string> } =>
  id === DEFAULT_ACCENT
    ? { light: declared(LIGHT_SET), dark: declared(DARK_SET) }
    : { light: declared(`:root[data-accent="${id}"]`), dark: declared(`:root[data-theme="dark"][data-accent="${id}"]`) };

const channel = (v: number): number => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("accent colours", () => {
  it("lists each colour once, with the default first", () => {
    expect(new Set(ACCENTS.map((a) => a.id)).size).toBe(ACCENTS.length);
    expect(ACCENTS[0].id).toBe(DEFAULT_ACCENT);
  });

  it("shows in the picker the colour the app really turns into", () => {
    for (const { id, color } of ACCENTS) expect(sets(id).light["--primary"], id).toBe(color);
  });

  it("restates every colour the accent owns, in both themes", () => {
    for (const { id } of ACCENTS) {
      const { light, dark } = sets(id);
      for (const name of ["--brand", "--primary", "--primary-strong", "--primary-soft", "--primary-line", "--toast-action"]) expect(light[name], `${id} light ${name}`).toBeTruthy();
      for (const name of ["--primary", "--primary-strong", "--primary-soft", "--primary-line", "--on-primary", "--toast-action"]) expect(dark[name], `${id} dark ${name}`).toBeTruthy();
    }
  });

  it("keeps text readable: on the accent, and in the accent on its tint", () => {
    for (const { id } of ACCENTS) {
      const { light, dark } = sets(id);
      expect(contrast("#ffffff", light["--primary"]), `${id} light button`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      expect(contrast(light["--primary-soft"], light["--primary"]), `${id} light tint`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      expect(contrast(dark["--on-primary"], dark["--primary"]), `${id} dark button`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      expect(contrast(dark["--primary-soft"], dark["--primary"]), `${id} dark tint`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });
});

/** A phone's storage and <html>, standing in for the real ones (these tests run without a browser). */
function stubBrowser(saved: Record<string, string>, blocked = false) {
  const store = new Map(Object.entries(saved));
  const root = { dataset: {} as Record<string, string | undefined> };
  const guard = () => {
    if (blocked) throw new Error("Storage is blocked");
  };
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => (guard(), store.get(key) ?? null),
    setItem: (key: string, value: string) => (guard(), void store.set(key, value)),
  });
  vi.stubGlobal("document", { documentElement: root });
  return { store, root };
}

/** The module as it is the moment the app starts: its choice is read from storage when it loads. */
async function startApp() {
  vi.resetModules();
  const accent = await import("./accent.ts");
  accent.initAccent();
  return accent;
}

describe("remembering the colour", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("puts the saved colour back when the app starts", async () => {
    const { root } = stubBrowser({ [ACCENT_KEY]: "blue" });
    await startApp();
    expect(root.dataset.accent).toBe("blue");
  });

  it("starts in the default when nothing, or something unknown, was saved", async () => {
    const cases: Record<string, string>[] = [{}, { [ACCENT_KEY]: "plaid" }];
    for (const saved of cases) {
      const { root } = stubBrowser(saved);
      await startApp();
      expect(root.dataset.accent).toBeUndefined();
    }
  });

  it("saves a choice and applies it; the default takes the attribute away again", async () => {
    const { store, root } = stubBrowser({});
    const accent = await startApp();
    accent.setAccent("teal");
    expect(store.get(ACCENT_KEY)).toBe("teal");
    expect(root.dataset.accent).toBe("teal");
    accent.setAccent(DEFAULT_ACCENT);
    expect(store.get(ACCENT_KEY)).toBe(DEFAULT_ACCENT);
    expect(root.dataset.accent).toBeUndefined();
  });

  it("still works for the visit when storage is blocked", async () => {
    const { root } = stubBrowser({}, true);
    const accent = await startApp();
    expect(() => accent.setAccent("pink")).not.toThrow();
    expect(root.dataset.accent).toBe("pink");
  });
});
