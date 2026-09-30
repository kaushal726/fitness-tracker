/* Quality checks for data/quotes/*.json. Errors mean a line is unusable; warnings mean "have a look".
 * The rules exist to keep the collection small, calm and original: short lines, no repeats, no emoji,
 * and mostly written for this app rather than borrowed.
 */
import { QUOTE_FILES } from "./dataFiles.ts";
import type { RawQuote, RawQuoteFile } from "./types.ts";

export const MIN_QUOTE_CHARS = 12;
/** Short enough to read at a glance on the opening screen. */
export const MAX_QUOTE_CHARS = 160;
/** A year of days without meeting the same line twice. */
export const MIN_QUOTES_TOTAL = 366;
const MIN_QUOTES_PER_THEME = 10;
/** Quotes from other people are the seasoning, not the meal. */
const MAX_ATTRIBUTED_SHARE = 0.1;
const SIMILAR_WARNING = 0.75;
const SIMILAR_ERROR = 0.9;

export interface QuoteIssue {
  level: "error" | "warning";
  file: string;
  id: string;
  message: string;
}

const SENTENCE_END = /[.!?।]$/;
const EMOJI = /\p{Extended_Pictographic}/u;
const NON_LATIN_LETTER = /(?!\p{Script=Latin})\p{L}/u;
const WORD = /[\p{L}\p{M}]+/gu;

const length = (text: string): number => [...text].length;

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(WORD) ?? []);
}

/** Share of words two lines have in common, 0 (nothing) to 1 (the same words). */
export function similarity(a: string, b: string): number {
  const first = words(a);
  const second = words(b);
  const shared = [...first].filter((w) => second.has(w)).length;
  const union = first.size + second.size - shared;
  return union === 0 ? 0 : shared / union;
}

function checkLine(theme: string, quote: RawQuote, push: (level: QuoteIssue["level"], message: string) => void): void {
  if (!new RegExp(`^${theme}_\\d{3,}$`).test(quote.id)) push("error", `id should look like ${theme}_001`);
  const { text, by, gloss } = quote;
  if (typeof text !== "string" || text !== text.trim() || /\s{2}/.test(text)) return push("error", "text is missing or has stray spaces");
  if (length(text) < MIN_QUOTE_CHARS) push("error", `text is shorter than ${MIN_QUOTE_CHARS} characters`);
  if (length(text) > MAX_QUOTE_CHARS) push("error", `text is ${length(text)} characters; the limit is ${MAX_QUOTE_CHARS}`);
  if (!SENTENCE_END.test(text)) push("warning", "text does not end like a sentence");
  if (EMOJI.test(text) || EMOJI.test(by ?? "") || EMOJI.test(gloss ?? "")) push("error", "emoji are not used in this app");
  if (by !== undefined && by.trim() === "") push("error", "by is empty; leave it out instead");
  if (gloss !== undefined && (gloss.trim() === "" || length(gloss) > MAX_QUOTE_CHARS)) push("error", "gloss is empty or too long");
  if (NON_LATIN_LETTER.test(text) && !gloss) push("error", "a line that is not in English needs a gloss");
}

export function validateQuotes(files: readonly RawQuoteFile[] = QUOTE_FILES): QuoteIssue[] {
  const issues: QuoteIssue[] = [];
  const seenIds = new Set<string>();
  const seenLines: { file: string; quote: RawQuote }[] = [];

  for (const file of files) {
    const at = (id: string) => (level: QuoteIssue["level"], message: string) => issues.push({ level, file: file.theme, id, message });
    const fileIssue = at("(file)");
    if (!/^[a-z0-9-]+$/.test(file.theme)) fileIssue("error", "theme should be lower-case letters, digits and hyphens");
    if (!file.label?.trim()) fileIssue("error", "label is missing");
    if (file.quotes.length < MIN_QUOTES_PER_THEME) fileIssue("warning", `only ${file.quotes.length} quotes; a theme needs at least ${MIN_QUOTES_PER_THEME}`);

    for (const quote of file.quotes) {
      const push = at(quote.id);
      if (seenIds.has(quote.id)) push("error", "id is used twice");
      seenIds.add(quote.id);
      checkLine(file.theme, quote, push);
      for (const earlier of seenLines) {
        const score = similarity(earlier.quote.text, quote.text);
        if (score >= SIMILAR_WARNING) push(score >= SIMILAR_ERROR ? "error" : "warning", `nearly the same as ${earlier.quote.id}: "${earlier.quote.text}"`);
      }
      seenLines.push({ file: file.theme, quote });
    }
  }

  if (seenLines.length < MIN_QUOTES_TOTAL) issues.push({ level: "warning", file: "(all)", id: "(all)", message: `${seenLines.length} quotes is less than a year of days` });
  const attributed = seenLines.filter((l) => l.quote.by).length;
  if (attributed > seenLines.length * MAX_ATTRIBUTED_SHARE) issues.push({ level: "warning", file: "(all)", id: "(all)", message: `${attributed} of ${seenLines.length} quotes are attributed; keep it under ${MAX_ATTRIBUTED_SHARE * 100}%` });
  return issues;
}
