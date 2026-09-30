import type { Settings } from "../data/types.ts";
import { quoteForDay } from "./daily.ts";
import type { Quote } from "./types.ts";

const READ_BASE_MS = 1600;
const READ_PER_WORD_MS = 140;
const MIN_READ_MS = 3000;
const MAX_READ_MS = 5000;

interface OpeningContext {
  hasProfile: boolean;
  settings: Pick<Settings, "dailyThought" | "lastThoughtDate">;
  today: string;
  /** People who asked for less motion get no opening screen, so no opening thought either. */
  reducedMotion: boolean;
}

/**
 * The thought that greets you as the app opens, or null when it should stay out of the way: someone who is
 * still setting up, someone who turned it off, and everyone who has already seen today's.
 */
export function openingThought({ hasProfile, settings, today, reducedMotion }: OpeningContext): Quote | null {
  if (!hasProfile || reducedMotion || !settings.dailyThought) return null;
  return settings.lastThoughtDate === today ? null : quoteForDay(today);
}

/** How long a quote takes to read at an easy pace, kept within limits so it neither flashes nor drags. */
export function readingTimeMs(quote: Pick<Quote, "text" | "gloss">): number {
  const words = `${quote.text} ${quote.gloss ?? ""}`.trim().split(/\s+/).length;
  return Math.min(MAX_READ_MS, Math.max(MIN_READ_MS, READ_BASE_MS + words * READ_PER_WORD_MS));
}
