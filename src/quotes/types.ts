/** One line as stored in data/quotes/<theme>.json. */
export interface RawQuote {
  /** Stable and unique: "<theme>_001". Never reused, so a quote can be found again. */
  id: string;
  text: string;
  /** Who said it. Left out for lines written for this app. */
  by?: string;
  /** An English rendering, for lines that are not in English. */
  gloss?: string;
}

export interface RawQuoteFile {
  theme: string;
  /** Plain-language name of the theme, for people editing the data. */
  label: string;
  quotes: RawQuote[];
}

export interface Quote extends RawQuote {
  theme: string;
}
