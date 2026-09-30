/* Local search over the food list. Understands aliases, word order ("chilli chicken" =
 * "chicken chilli"), prefixes while typing, and small spelling differences.
 * Ranking: exact > alias > prefix > word match > fuzzy, then commonly eaten foods, the
 * user's favourites and recents, and shorter names first.
 */
import popular from "../../data/popular-foods.json" with { type: "json" };
import { getAllFoods } from "./registry.ts";
import { boundedDistance, normalizeForSearch, stem, tokenizeForSearch } from "./text.ts";
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

function tokenLevel(ix: Indexed, token: string): number {
  if (ix.nameWords.includes(token)) return LEVEL.nameWord;
  if (hasPrefix(ix.nameWords, token)) return LEVEL.namePrefix;
  if (ix.aliasWords.has(token)) return LEVEL.aliasWord;
  if (hasPrefix(ix.aliasWords, token)) return LEVEL.aliasPrefix;
  if (ix.textWords.has(token)) return LEVEL.textWord;
  if (hasPrefix(ix.textWords, token)) return LEVEL.textPrefix;
  if (token.length >= MIN_SUBSTRING_LENGTH && ix.nameWords.some((w) => w.includes(token))) return LEVEL.nameSubstring;
  if (isFuzzy(ix.nameWords, token) || isFuzzy(ix.aliasWords, token)) return LEVEL.fuzzy;
  return 0;
}

function baseScore(ix: Indexed, query: string, tokens: string[]): number {
  if (ix.name === query) return SCORE.exactName;
  if (ix.aliases.includes(query)) return SCORE.exactAlias;
  const endsWord = (text: string) => text.length === query.length || text[query.length] === " ";
  if (ix.name.startsWith(query)) return endsWord(ix.name) ? SCORE.namePrefix : SCORE.partialWordPrefix;
  if (ix.aliases.some((a) => a.startsWith(query) && endsWord(a))) return SCORE.aliasPrefix;
  let total = 0;
  for (const token of tokens) {
    const level = tokenLevel(ix, token);
    if (level === 0) return 0;
    total += level;
  }
  return SCORE.wordMatchBase + (total / tokens.length) * SCORE.wordMatchPerLevel;
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

export function searchFood(query: string, options: SearchOptions = {}): Food[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  const tokens = q.split(" ").map(stem);
  const favorites = new Set(options.favoriteIds);
  const recents = new Map((options.recentIds ?? []).map((id, i) => [id, i]));
  const pool = options.extraFoods?.length ? [...registryIndex(), ...options.extraFoods.map(index)] : registryIndex();

  const scored: { food: Food; score: number }[] = [];
  for (const ix of pool) {
    if (!passesFilters(ix.food, options)) continue;
    const base = baseScore(ix, q, tokens);
    if (base === 0) continue;
    const recentRank = recents.get(ix.food.id);
    const score = base
      + (POPULARITY.get(ix.food.id) ?? 0)
      + (favorites.has(ix.food.id) ? SCORE.favorite : 0)
      + (recentRank === undefined ? 0 : Math.max(0, SCORE.recentMax - recentRank * SCORE.recentStep))
      + (tokens.some((t) => ix.categoryWords.has(t)) ? SCORE.categoryHit : 0)
      - (ix.food.type === "composite" ? SCORE.composite : 0)
      - ix.name.length * SCORE.perNameChar;
    scored.push({ food: ix.food, score });
  }
  scored.sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name));
  return scored.slice(0, options.limit ?? DEFAULT_LIMIT).map((s) => s.food);
}
