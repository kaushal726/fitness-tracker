/* Guesses what a word nobody has was meant to be: a mishearing ("wet" for "veg"), a spelling of
 * the same sound ("bindi" for "bhindi"), or two words run together ("paneertikka").
 * Only words the food list really uses are ever suggested.
 */
import { boundedDistance, fold, foldLimit, mustStartTheSame } from "./text.ts";

const MIN_WORD_LENGTH = 3;
const MAX_REPAIRS_PER_WORD = 3;
/** A word this many foods use is taken as meant; a rarer one may be a slip that happens to be a real word ("wet" for "veg"). */
const TRUSTED_COUNT = 3;

interface VocabularyWord {
  word: string;
  folded: string;
  /** How many foods use the word; a word more foods use is the likelier guess. */
  count: number;
}

export interface Vocabulary {
  words: VocabularyWord[];
  known: ReadonlySet<string>;
}

/**
 * The words of the food list (one list per food), with how many foods use each, leaving out the words `leaveOut` says are not worth guessing.
 * A known respelling ("chawal" for "rice") sounds like its own word, so a mishearing of it finds the word it stands for.
 */
export function buildVocabulary(wordsPerFood: Iterable<Iterable<string>>, leaveOut: (word: string) => boolean, spellings: Record<string, string>): Vocabulary {
  const counts = new Map<string, number>();
  for (const foodWords of wordsPerFood) {
    for (const word of new Set(foodWords)) {
      if (word.length >= MIN_WORD_LENGTH && !/\d/.test(word) && !leaveOut(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const words = [...counts].map(([word, count]) => ({ word, folded: fold(word), count }));
  for (const [respelling, word] of Object.entries(spellings)) {
    const count = counts.get(word);
    if (count !== undefined) words.push({ word, folded: fold(respelling), count });
  }
  return { words, known: new Set(counts.keys()) };
}

/** Whether the word, or what it could grow into while still being typed, is a word many foods use. */
export function isTrustedWord(vocabulary: Vocabulary, word: string): boolean {
  return vocabulary.words.some((w) => w.count >= TRUSTED_COUNT && w.word.startsWith(word));
}

function splitInTwo(token: string, vocabulary: Vocabulary): string[][] {
  const splits: string[][] = [];
  for (let at = MIN_WORD_LENGTH; at <= token.length - MIN_WORD_LENGTH; at++) {
    const left = token.slice(0, at);
    const right = token.slice(at);
    if (vocabulary.known.has(left) && vocabulary.known.has(right)) splits.push([left, right]);
  }
  return splits;
}

/** The ways one doubtful word may be read besides as typed, likeliest first; each is the word or words to search in its place. */
export function repairOptions(token: string, vocabulary: Vocabulary): string[][] {
  const folded = fold(token);
  const limit = foldLimit(folded.length);
  const near: { word: string; distance: number; count: number }[] = [];
  for (const candidate of vocabulary.words) {
    if (Math.abs(candidate.folded.length - folded.length) > limit) continue;
    if (mustStartTheSame(folded.length) && candidate.folded[0] !== folded[0]) continue;
    const distance = boundedDistance(folded, candidate.folded, limit);
    if (distance <= limit) near.push({ word: candidate.word, distance, count: candidate.count });
  }
  near.sort((a, b) => a.distance - b.distance || b.count - a.count);
  const guesses = [...new Set(near.map((n) => n.word))].filter((word) => word !== token).slice(0, MAX_REPAIRS_PER_WORD).map((word) => [word]);
  return [...splitInTwo(token, vocabulary), ...guesses];
}
