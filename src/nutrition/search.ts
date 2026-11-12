/* Local search over the food list. Understands aliases, word order ("chilli chicken" =
 * "chicken chilli"), prefixes while typing, and small spelling differences.
 * Ranking: exact > alias > prefix > word match > fuzzy, then commonly eaten foods, the
 * user's favourites and recents, and shorter names first.
 */
import popular from "../../data/popular-foods.json" with { type: "json" };
import { getAllFoods, getFoodById } from "./registry.ts";
import { buildVocabulary, isTrustedWord, repairOptions, type Vocabulary } from "./searchRepair.ts";
import { boundedDistance, normalizeForSearch, SPELLING_VARIANTS, stem, tokenizeForSearch } from "./text.ts";
import type { Food } from "./types.ts";

const DEFAULT_LIMIT = 20;
const MIN_FUZZY_LENGTH = 5;
const LONG_WORD_LENGTH = 7;
const MIN_SUBSTRING_LENGTH = 3;

const SCORE = {
  exactName: 1000,
  exactAlias: 900,
  namePrefix: 530,
  /** Below a whole-word match in the name, so a "Veg Sandwich" beats a food that only lists "sandwich bread" as a nickname. */
  aliasPrefix: 450,
  /** The typed text stops inside a longer word of the name ("pane" in "paneer"): it is still being typed, so weaker than a whole-word match. */
  partialWordPrefix: 470,
  wordMatchBase: 200,
  wordMatchPerLevel: 3,
  popularMax: 60,
  favorite: 50,
  recentMax: 40,
  recentStep: 2,
  /** The foods this person eats most come first, ahead even of an exact name match on a food they never eat. */
  frequentMax: 480,
  frequentStep: 6,
  categoryHit: 20,
  perNameChar: 0.3,
  /** Ready-made meals rank just below the single foods they are made of. */
  composite: 60,
} as const;

/** How well one typed word matched a food. Higher is better; 0 is no match. */
const LEVEL = { nameWord: 100, namePrefix: 90, aliasWord: 80, aliasPrefix: 70, textWord: 50, textPrefix: 40, nameSubstring: 30, fuzzy: 25 } as const;

const POPULARITY = new Map<string, number>((popular.ids as string[]).map((id, i, all) => [id, SCORE.popularMax * (1 - i / all.length)]));

interface Indexed {
  food: Food;
  name: string;
  nameWords: string[];
  aliases: string[];
  aliasWords: Set<string>;
  textWords: Set<string>;
  categoryWords: Set<string>;
}

function index(food: Food): Indexed {
  const aliases = food.aliases.map(normalizeForSearch);
  return {
    food,
    name: normalizeForSearch(food.name),
    nameWords: tokenizeForSearch(food.name).map(stem),
    aliases,
    aliasWords: new Set(aliases.flatMap((a) => a.split(" ")).map(stem)),
    textWords: new Set(tokenizeForSearch(food.searchableText).map(stem)),
    categoryWords: new Set(tokenizeForSearch(`${food.category} ${food.subCategory} ${food.cuisine}`).map(stem)),
  };
}

let baseIndex: Indexed[] | null = null;
const registryIndex = () => (baseIndex ??= getAllFoods().map(index));

let baseVocabulary: Vocabulary | null = null;
const vocabularyOf = (pool: Indexed[]): Vocabulary => buildVocabulary(pool.map((ix) => [...ix.nameWords, ...ix.aliasWords]), (word) => SKIPPABLE_WORDS.has(word) || PARTICLES.has(word), SPELLING_VARIANTS);

function maxDistance(word: string): number {
  if (word.length < MIN_FUZZY_LENGTH) return 0;
  return word.length >= LONG_WORD_LENGTH ? 2 : 1;
}

function hasPrefix(words: Iterable<string>, token: string): boolean {
  for (const w of words) if (w.startsWith(token)) return true;
  return false;
}

function isFuzzy(words: Iterable<string>, token: string): boolean {
  const max = maxDistance(token);
  if (max === 0) return false;
  for (const w of words) if (boundedDistance(token, w, max) <= max) return true;
  return false;
}

function tokenLevel(ix: Indexed, token: string, fuzzy = true): number {
  if (ix.nameWords.includes(token)) return LEVEL.nameWord;
  if (hasPrefix(ix.nameWords, token)) return LEVEL.namePrefix;
  if (ix.aliasWords.has(token)) return LEVEL.aliasWord;
  if (hasPrefix(ix.aliasWords, token)) return LEVEL.aliasPrefix;
  if (ix.textWords.has(token)) return LEVEL.textWord;
  if (hasPrefix(ix.textWords, token)) return LEVEL.textPrefix;
  if (token.length >= MIN_SUBSTRING_LENGTH && ix.nameWords.some((w) => w.includes(token))) return LEVEL.nameSubstring;
  if (fuzzy && (isFuzzy(ix.nameWords, token) || isFuzzy(ix.aliasWords, token))) return LEVEL.fuzzy;
  return 0;
}

function baseScore(ix: Indexed, query: string, tokens: string[], fuzzy = true): number {
  if (ix.name === query) return SCORE.exactName;
  if (ix.aliases.includes(query)) return SCORE.exactAlias;
  const endsWord = (text: string) => text.length === query.length || text[query.length] === " ";
  if (ix.name.startsWith(query)) return endsWord(ix.name) ? SCORE.namePrefix : SCORE.partialWordPrefix;
  if (ix.aliases.some((a) => a.startsWith(query) && endsWord(a))) return SCORE.aliasPrefix;
  let total = 0;
  for (const token of tokens) {
    const level = tokenLevel(ix, token, fuzzy);
    if (level === 0) return 0;
    total += level;
  }
  return SCORE.wordMatchBase + (total / tokens.length) * SCORE.wordMatchPerLevel;
}

/** The commonly eaten foods, most common first. Needs the food data loaded. */
export function popularFoods(): Food[] {
  return (popular.ids as string[]).map((id) => getFoodById(id)).filter((f): f is Food => f !== undefined);
}

/** Foods of one category, the commonly eaten ones first, then the rest by name. For browsing without typing. */
export function browseCategory(category: string, extraFoods: Food[] = []): Food[] {
  return [...getAllFoods(), ...extraFoods]
    .filter((f) => f.category === category)
    .sort((a, b) => (POPULARITY.get(b.id) ?? 0) - (POPULARITY.get(a.id) ?? 0) || a.name.localeCompare(b.name));
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  cuisine?: string;
  foodType?: Food["foodType"];
  tag?: string;
  /** Most recent first. */
  recentIds?: string[];
  /** The foods eaten most, the most eaten first. */
  frequentIds?: string[];
  favoriteIds?: string[];
  /** User-created foods, searched together with the built-in ones. */
  extraFoods?: Food[];
}

function passesFilters(food: Food, o: SearchOptions): boolean {
  return (!o.category || food.category === o.category)
    && (!o.cuisine || food.cuisine === o.cuisine)
    && (!o.foodType || food.foodType === o.foodType)
    && (!o.tag || food.tags.includes(o.tag));
}

/** Words that say how a food was made or how much of it, not what it is: "homemade curd", "1 katori dal". Only dropped when nothing matched them. */
const SKIPPABLE_WORDS: ReadonlySet<string> = new Set(
  ["one", "two", "three", "four", "five", "half", "quarter", "home", "homemade", "made", "fresh", "plain", "normal", "regular", "extra", "some", "my", "own", "the", "a", "an", "of", "with", "and", "small", "medium", "large", "big", "bowl", "katori", "cup", "glass", "plate", "piece", "slice", "spoon", "tbsp", "tsp", "gram", "g", "ml", "kg", "litre", "liter", "serving", "portion"].map(stem),
);
/** Hindi words that only join the others ("besan ka chilla", "bhindi ki sabzi", "aloo ke parathe"): they say nothing about which food. */
const PARTICLES: ReadonlySet<string> = new Set(["ka", "ki", "ke", "wala", "wali", "wale", "waala", "waali"]);
const withoutParticles = (words: string[]): string[] => {
  const content = words.filter((w) => !PARTICLES.has(w));
  return content.length > 0 ? content : words;
};
/** How many, in Hindi ("do roti", "teen chapati"): never part of a food's name, so dropped before searching. */
const COUNT_WORDS: ReadonlySet<string> = new Set(["ek", "do", "teen", "chaar", "paanch", "panch", "chhe", "aadha", "adha"]);
const QUANTITY = /^\d+(?:[.,]\d+)?$/;
const isSkippable = (token: string): boolean => SKIPPABLE_WORDS.has(token) || QUANTITY.test(token);

export interface SearchOutcome {
  foods: Food[];
  /** True when no food matched every word, so these are the closest matches instead. */
  closest: boolean;
  /** Set when a word nobody has was read as another ("wet sandwich" as "veg sandwich"): what was searched in its place. */
  corrected?: string;
}

/** The most readings of a query tried together; each unknown word multiplies them. */
const MAX_READINGS = 8;
/** Fewer matches than this for a query with a descriptor word and the plain food is added after them. */
const FEW_MATCHES = 5;

/** Every way to read the query, each doubtful word as typed or as one of its likely meanings; the likeliest first. */
function readings(tokens: string[], doubtful: Set<string>, vocabulary: Vocabulary): string[][] {
  let all: string[][] = [[]];
  for (const token of tokens) {
    const options = doubtful.has(token) ? [[token], ...repairOptions(token, vocabulary)] : [[token]];
    all = all.flatMap((soFar) => options.map((option) => [...soFar, ...option])).slice(0, MAX_READINGS);
  }
  return all;
}

export function searchFoodDetailed(query: string, options: SearchOptions = {}): SearchOutcome {
  const typed = normalizeForSearch(query).split(" ");
  const counted = typed.filter((w) => !COUNT_WORDS.has(w));
  let q = (counted.length > 0 ? counted : typed).join(" ");
  if (!q) return { foods: [], closest: false };
  let tokens = withoutParticles(q.split(" ")).map(stem);
  const favorites = new Set(options.favoriteIds);
  const recents = new Map((options.recentIds ?? []).map((id, i) => [id, i]));
  const frequent = new Map((options.frequentIds ?? []).map((id, i) => [id, i]));
  const pool = options.extraFoods?.length ? [...registryIndex(), ...options.extraFoods.map(index)] : registryIndex();
  const allowed = (ix: Indexed): boolean => passesFilters(ix.food, options);

  /** The pool ranked by `base` (0 = no match), then by how common, favourite and recent a food is, and by a shorter name. */
  const rank = (words: string[], base: (ix: Indexed) => number): Food[] => {
    const scored: { food: Food; score: number }[] = [];
    for (const ix of pool) {
      if (!allowed(ix)) continue;
      const b = base(ix);
      if (b === 0) continue;
      const recentRank = recents.get(ix.food.id);
      const frequentRank = frequent.get(ix.food.id);
      const score = b
        + (POPULARITY.get(ix.food.id) ?? 0)
        + (favorites.has(ix.food.id) ? SCORE.favorite : 0)
        + (recentRank === undefined ? 0 : Math.max(0, SCORE.recentMax - recentRank * SCORE.recentStep))
        + (frequentRank === undefined ? 0 : Math.max(0, SCORE.frequentMax - frequentRank * SCORE.frequentStep))
        + (words.some((t) => ix.categoryWords.has(t)) ? SCORE.categoryHit : 0)
        - (ix.food.type === "composite" ? SCORE.composite : 0)
        - ix.name.length * SCORE.perNameChar;
      scored.push({ food: ix.food, score });
    }
    scored.sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name));
    return scored.slice(0, options.limit ?? DEFAULT_LIMIT).map((s) => s.food);
  };
  const everyWord = (text: string, words: string[], fuzzy = true): Food[] => rank(words, (ix) => baseScore(ix, text, words, fuzzy));

  /** "fresh curd" matches a few branded foods; the plain food the descriptor only describes ("curd") follows them. */
  const withPlainFood = (matches: Food[]): Food[] => {
    const core = tokens.filter((t) => !isSkippable(t));
    if (matches.length >= FEW_MATCHES || core.length === 0 || core.length === tokens.length) return matches;
    const extra = everyWord(core.join(" "), core).filter((f) => !matches.some((m) => m.id === f.id));
    return [...matches, ...extra].slice(0, options.limit ?? DEFAULT_LIMIT);
  };
  let found = everyWord(q, tokens);
  // "2 egg", "3 roti": a number is how many, unless the food's own name starts with what was typed ("chicken 65").
  const wanted = tokens.filter((t) => !QUANTITY.test(t));
  const isNamedSo = (food: Food): boolean => [food.name, ...food.aliases].some((n) => normalizeForSearch(n).startsWith(q));
  if (found.length > 0 && wanted.length < tokens.length && wanted.some((t) => !isSkippable(t)) && !isNamedSo(found[0])) {
    tokens = wanted;
    q = wanted.join(" ");
    found = everyWord(q, tokens);
  }
  if (found.length > 0) return { foods: withPlainFood(found), closest: false };

  // A word few foods have may be a mishearing or another spelling ("wet sandwich", "bindi"): search what it was likely meant to be.
  const vocabulary = options.extraFoods?.length ? vocabularyOf(pool) : (baseVocabulary ??= vocabularyOf(pool));
  const doubtful = new Set(tokens.filter((t) => !isSkippable(t) && !isTrustedWord(vocabulary, t)));
  if (doubtful.size > 0) {
    // The first reading (every word as typed) is what already found nothing.
    for (const reading of readings(tokens, doubtful, vocabulary).slice(1)) {
      const repaired = everyWord(reading.join(" "), reading, false);
      if (repaired.length > 0) return { foods: repaired, closest: false, corrected: reading.join(" ") };
    }
  }
  if (tokens.length < 2) return { foods: [], closest: false };

  // Nothing matched every word ("homemade curd"): leave out words that only describe, and words no food has, and search the rest.
  const known = tokens.filter((t) => !isSkippable(t) && pool.some((ix) => allowed(ix) && tokenLevel(ix, t) > 0));
  if (known.length === 0) return { foods: [], closest: false };
  const rest = everyWord(known.join(" "), known);
  if (rest.length > 0) return { foods: rest, closest: true };
  const some = rank(known, (ix) => {
    const levels = known.map((t) => tokenLevel(ix, t)).filter((l) => l > 0);
    return levels.length === 0 ? 0 : (levels.length / known.length) * SCORE.wordMatchBase + (levels.reduce((a, b) => a + b, 0) / levels.length) * SCORE.wordMatchPerLevel;
  });
  return { foods: some, closest: some.length > 0 };
}

export function searchFood(query: string, options: SearchOptions = {}): Food[] {
  return searchFoodDetailed(query, options).foods;
}
