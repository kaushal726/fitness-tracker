import { QUOTE_FILES } from "./dataFiles.ts";
import type { Quote } from "./types.ts";

/** Every quote from every theme in one flat list. */
export const QUOTES: readonly Quote[] = QUOTE_FILES.flatMap((file) => file.quotes.map((quote) => ({ ...quote, theme: file.theme })));
