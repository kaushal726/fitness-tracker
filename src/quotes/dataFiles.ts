/* Every quote file, imported statically so it works in Vite and in Node scripts alike.
 * Adding a theme? Add it here (a test fails if a data/quotes/*.json file is missing from this list).
 */
import type { RawQuoteFile } from "./types.ts";
import awareness from "../../data/quotes/awareness.json" with { type: "json" };
import balance from "../../data/quotes/balance.json" with { type: "json" };
import fuel from "../../data/quotes/fuel.json" with { type: "json" };
import gratitude from "../../data/quotes/gratitude.json" with { type: "json" };
import habits from "../../data/quotes/habits.json" with { type: "json" };
import home from "../../data/quotes/home.json" with { type: "json" };
import kindness from "../../data/quotes/kindness.json" with { type: "json" };
import longgame from "../../data/quotes/longgame.json" with { type: "json" };
import mind from "../../data/quotes/mind.json" with { type: "json" };
import mindful from "../../data/quotes/mindful.json" with { type: "json" };
import strength from "../../data/quotes/strength.json" with { type: "json" };
import wisdom from "../../data/quotes/wisdom.json" with { type: "json" };

export const QUOTE_FILES: RawQuoteFile[] = [
  awareness as RawQuoteFile,
  balance as RawQuoteFile,
  fuel as RawQuoteFile,
  gratitude as RawQuoteFile,
  habits as RawQuoteFile,
  home as RawQuoteFile,
  kindness as RawQuoteFile,
  longgame as RawQuoteFile,
  mind as RawQuoteFile,
  mindful as RawQuoteFile,
  strength as RawQuoteFile,
  wisdom as RawQuoteFile,
];
