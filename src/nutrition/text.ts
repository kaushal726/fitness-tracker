/** Lower-case, accent-free, punctuation-free text with single spaces. "Chilli-Chicken (Dry)" -> "chilli chicken dry". */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const text = normalizeText(input);
  return text ? text.split(" ") : [];
}

/** Other common spellings of words the data writes one way. Fuzzy matching cannot reach these: they are short or differ by more than one letter. */
const SPELLING_VARIANTS: Record<string, string> = {
  daal: "dal",
  dhal: "dal",
  dahl: "dal",
  chat: "chaat",
  laddu: "ladoo",
  laddoo: "ladoo",
  ladu: "ladoo",
  panir: "paneer",
  khir: "kheer",
  rabadi: "rabri",
  papadam: "papad",
  papadum: "papad",
  pappad: "papad",
};

/** normalizeText with every word spelled the way the data spells it, so either spelling finds the same foods. */
export function normalizeForSearch(input: string): string {
  return normalizeText(input).split(" ").map((word) => SPELLING_VARIANTS[word] ?? word).join(" ");
}

export function tokenizeForSearch(input: string): string[] {
  const text = normalizeForSearch(input);
  return text ? text.split(" ") : [];
}

/** Levenshtein distance that gives up (returns max + 1) once it can no longer stay within `max`. */
export function boundedDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

const MIN_STEM_LENGTH = 4;

/** Drops a plural "s" so "eggs" finds "egg" and "momo" finds "momos". Applied to both sides, so odd stems still agree. */
export function stem(word: string): string {
  return word.length >= MIN_STEM_LENGTH && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}
