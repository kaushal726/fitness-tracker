import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { addDays } from "../lib/dates.ts";
import { dayNumber, quoteForDay } from "./daily.ts";
import { QUOTE_FILES } from "./dataFiles.ts";
import { QUOTES } from "./library.ts";
import type { RawQuoteFile } from "./types.ts";
import { MAX_QUOTE_CHARS, MIN_QUOTES_TOTAL, similarity, validateQuotes } from "./validation.ts";

const DATA_DIR = fileURLToPath(new URL("../../data/quotes", import.meta.url));
const messages = (files: RawQuoteFile[]) => validateQuotes(files).map((i) => i.message);

describe("the collection", () => {
  it("has no errors and enough quotes for a year without a repeat", () => {
    expect(validateQuotes().filter((i) => i.level === "error")).toEqual([]);
    expect(QUOTES.length).toBeGreaterThanOrEqual(MIN_QUOTES_TOTAL);
  });

  it("lists every data file in dataFiles.ts", () => {
    const onDisk = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort();
    expect(QUOTE_FILES.map((f) => f.theme).sort()).toEqual(onDisk);
  });

  it("gives every line a theme and a unique id", () => {
    expect(new Set(QUOTES.map((q) => q.id)).size).toBe(QUOTES.length);
    expect(QUOTES.every((q) => q.id.startsWith(`${q.theme}_`))).toBe(true);
  });
});

describe("validation", () => {
  const file = (quotes: RawQuoteFile["quotes"]): RawQuoteFile => ({ theme: "fuel", label: "Fuel", quotes });

  it("rejects lines that are too long, have emoji, or are not in English without a gloss", () => {
    const found = messages([file([
      { id: "fuel_001", text: `${"word ".repeat(40).trim()}.` },
      { id: "fuel_002", text: "Eat well today 🍎." },
      { id: "fuel_003", text: "पहला सुख निरोगी काया।" },
    ])]);
    expect(found).toContain(`text is ${"word ".repeat(40).trim().length + 1} characters; the limit is ${MAX_QUOTE_CHARS}`);
    expect(found).toContain("emoji are not used in this app");
    expect(found).toContain("a line that is not in English needs a gloss");
  });

  it("rejects repeated ids, badly formed ids and near-identical lines", () => {
    const found = messages([file([
      { id: "fuel_001", text: "A slow steady morning meal carries you through the afternoon." },
      { id: "fuel_001", text: "Something else entirely, written to sit beside it." },
      { id: "other_7", text: "A slow steady morning meal carries you through the afternoon!" },
    ])]);
    expect(found).toContain("id is used twice");
    expect(found).toContain("id should look like fuel_001");
    expect(found.some((m) => m.startsWith("nearly the same as fuel_001"))).toBe(true);
  });

  it("measures how alike two lines are by the words they share", () => {
    expect(similarity("Eat well today.", "Eat well today!")).toBe(1);
    expect(similarity("Eat well today.", "Sleep early tonight.")).toBe(0);
    expect(similarity("", "")).toBe(0);
  });
});

describe("the thought of the day", () => {
  it("counts calendar days without being thrown by daylight saving", () => {
    expect(dayNumber("1970-01-01")).toBe(0);
    let day = "2025-01-01";
    for (let i = 0; i < 800; i++) {
      const next = addDays(day, 1);
      expect(dayNumber(next) - dayNumber(day)).toBe(1);
      day = next;
    }
  });

  it("is the same all day and for everyone, and different from yesterday's", () => {
    expect(quoteForDay("2026-06-15")).toBe(quoteForDay("2026-06-15"));
    expect(quoteForDay("2026-06-15").id).not.toBe(quoteForDay("2026-06-14").id);
  });

  it("shows every quote once before any comes round again, never two of a theme in a row", () => {
    const start = "2026-01-01";
    const cycle = Array.from({ length: QUOTES.length }, (_, i) => quoteForDay(addDays(start, i)));
    expect(new Set(cycle.map((q) => q.id)).size).toBe(QUOTES.length);
    const repeatedTheme = cycle.filter((q, i) => i > 0 && q.theme === cycle[i - 1].theme);
    expect(repeatedTheme).toEqual([]);
    expect(quoteForDay(addDays(start, QUOTES.length)).id).toBe(cycle[0].id);
  });
});
