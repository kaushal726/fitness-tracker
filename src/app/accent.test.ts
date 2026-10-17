import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ACCENTS, DEFAULT_ACCENT, type AccentId } from "./accent.ts";

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
