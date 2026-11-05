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
export const SPELLING_VARIANTS: Record<string, string> = {
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
  chila: "chilla",
  cheela: "chilla",
  parathe: "paratha",
  parantha: "paratha",
  paranthe: "paratha",
  pakode: "pakora",
  pakoda: "pakora",
  pakore: "pakora",
  gobhi: "gobi",
  sabji: "sabzi",
  sabjee: "sabzi",
  subji: "sabzi",
  subzi: "sabzi",
  rotiyan: "roti",
  rotian: "roti",
  chili: "chilli",
  chilly: "chilli",
  soybean: "soya",
  soybeans: "soya",
  soyabean: "soya",
  soyabeans: "soya",
  soy: "soya",
  vegetable: "veg",
  vegetables: "veg",
  veggie: "veg",
  vedge: "veg",
  vegi: "veg",
  vegie: "veg",
  chiz: "cheese",
  chis: "cheese",
  veggies: "veg",
  // spellings people use for the same dish or ingredient
  sandwhich: "sandwich", sandwitch: "sandwich", sanwich: "sandwich", sandwhiches: "sandwiches", sandvich: "sandwich", sandwish: "sandwich", sandwiches: "sandwich",
  burgar: "burger", pizzaa: "pizza", maggie: "maggi", magi: "maggi",
  idly: "idli", iddli: "idli", idlis: "idli", dosai: "dosa", dose: "dosa", dhosa: "dosa", dosha: "dosa", sambhar: "sambar", sambaar: "sambar", sambher: "sambar",
  uttappa: "uttapam", uttapa: "uttapam", uthappam: "uttapam", uttappam: "uttapam", uthapam: "uttapam", wada: "vada", vade: "vada", vadai: "vada", vadaa: "vada",
  poori: "puri", pooris: "puri", bhature: "bhatura", batura: "bhatura", bhaturey: "bhatura", kachauri: "kachori", kachodi: "kachori", kachoris: "kachori",
  jilebi: "jalebi", jalebee: "jalebi", jamoon: "jamun", jamoons: "jamun", rasagulla: "rasgulla", rosogolla: "rasgulla", roshogolla: "rasgulla", rasgula: "rasgulla",
  halva: "halwa", halwah: "halwa", kofte: "kofta", koftay: "kofta", biriyani: "biryani", briyani: "biryani", biriani: "biryani", biryanee: "biryani", biryaani: "biryani",
  pulav: "pulao", pilaf: "pulao", pilau: "pulao", pulaw: "pulao", khichri: "khichdi", kichdi: "khichdi", khichadi: "khichdi", kichadi: "khichdi", khichdee: "khichdi",
  rajmah: "rajma", tika: "tikka", masaala: "masala", massala: "masala", kabab: "kebab", kabob: "kebab", kebap: "kebab", kabaab: "kebab", sheekh: "seekh",
  tandori: "tandoori", tandoor: "tandoori", kurma: "korma", qorma: "korma", makhni: "makhani", makkhani: "makhani", maakhani: "makhani",
  thaali: "thali", lassee: "lassi", payasa: "payasam", uppuma: "upma", uppittu: "upma", pohe: "poha", pauwa: "poha", dhokala: "dhokla", dhokali: "dhokla",
  thapla: "thepla", paav: "pav", pao: "pav", bhajji: "bhaji", bhajee: "bhaji", bhajiya: "bhaji", bhurjee: "bhurji", burji: "bhurji", tarka: "tadka", tadaka: "tadka",
  zeera: "jeera", jira: "jeera", cumin: "jeera", burfi: "barfi", burfee: "barfi", barfee: "barfi", pedha: "peda", modaka: "modak", namkin: "namkeen", chikky: "chikki",
  kadhai: "kadai", karahi: "kadai", kadahi: "kadai", kadhahi: "kadai", tava: "tawa", achaari: "achari", aachari: "achari",
  // words that mean the same in English and Hindi
  anda: "egg", ande: "egg", andey: "egg", eggs: "egg", dahi: "curd", yogurt: "curd", yoghurt: "curd", yogourt: "curd", curds: "curd",
  chawal: "rice", chaawal: "rice", aloo: "potato", alu: "potato", aaloo: "potato", batata: "potato", potatoes: "potato",
  cauliflower: "gobi", phoolgobi: "gobi", okra: "bhindi", ladyfinger: "bhindi", ladyfingers: "bhindi", brinjal: "baingan", eggplant: "baingan", aubergine: "baingan", baigan: "baingan", bengan: "baingan",
  spinach: "palak", lamb: "mutton", goat: "mutton", gosht: "mutton", murgh: "chicken", murg: "chicken", kukkad: "chicken", chickens: "chicken",
  machhli: "fish", machli: "fish", maach: "fish", macher: "fish", doodh: "milk", kaapi: "coffee", kapi: "coffee", chai: "tea", chapati: "roti", chapathi: "roti", chapatti: "roti", rotis: "roti",
  pyaz: "onion", pyaaz: "onion", pyaj: "onion", tamatar: "tomato", tamato: "tomato", adrak: "ginger", lehsun: "garlic", lasun: "garlic", lahsun: "garlic", nimbu: "lemon", nimbo: "lemon",
  gajar: "carrot", mutter: "matar", peas: "matar", mirchi: "chilli", mirch: "chilli", fenugreek: "methi", kela: "banana", aam: "mango", seb: "apple", khoya: "khoa", mawa: "khoa",
  noodle: "noodles", suji: "sooji", semolina: "sooji", rava: "sooji", rawa: "sooji", ghiya: "lauki", doodhi: "lauki", louki: "lauki", nachni: "ragi",
};

/** Several words that mean one: replaced before the words are looked at, in what is typed and in the names. Longest first. */
const PHRASES: [RegExp, string][] = [
  [/\bcottage cheese\b/g, "paneer"], [/\bgram flour\b/g, "besan"], [/\blad(?:y|ies)(?:s)? fingers?\b/g, "bhindi"], [/\bbottle gourd\b/g, "lauki"],
  [/\bblack eyed peas?\b/g, "lobia"], [/\bkidney beans?\b/g, "rajma"], [/\bchick peas?\b/g, "chickpea"], [/\bice ?cream\b/g, "ice cream"], [/\bmilk ?shakes?\b/g, "milkshake"],
  [/\bcorn ?flakes\b/g, "cornflakes"], [/\bfrench fries\b/g, "fries"], [/\bgol ?gappe?a?s?\b/g, "pani puri"], [/\bphuchka\b/g, "pani puri"], [/\bwhole wheat\b/g, "wholewheat"],
  [/\bgulab jamoons?\b/g, "gulab jamun"], [/\bbread omlet+e?\b/g, "bread omelette"], [/\bomlet+e?\b/g, "omelette"], [/\bbisi ?bele ?(?:bhat|bath|bhaat)\b/g, "bisi bele bath"], [/\bbisibele\b/g, "bisi bele"],
];

/** normalizeText with every word spelled the way the data spells it, so either spelling finds the same foods. */
export function normalizeForSearch(input: string): string {
  const text = PHRASES.reduce((t, [pattern, to]) => t.replace(pattern, to), normalizeText(input));
  return text.split(" ").map((word) => SPELLING_VARIANTS[word] ?? word).join(" ");
}
export function tokenizeForSearch(input: string): string[] {
  const text = normalizeForSearch(input);
  return text ? text.split(" ") : [];
}

/** Levenshtein distance that gives up (returns max + 1) once it can no longer stay within `max`. */
export function boundedDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let beforePrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      // Two neighbouring letters swapped ("noodel" for "noodle") is one slip, not two.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, beforePrev[j - 2] + 1);
      row.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    beforePrev = prev;
    prev = row;
  }
  return prev[b.length];
}

const MIN_STEM_LENGTH = 4;

/** Drops a plural "s" so "eggs" finds "egg" and "momo" finds "momos". Applied to both sides, so odd stems still agree. */
export function stem(word: string): string {
  return word.length >= MIN_STEM_LENGTH && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

/**
 * A word as it sounds, roughly: the spellings of one sound ("bhindi" and "bindi", "sambhar" and "sambar", "wet" and "vet")
 * come out the same, so a typo or a mishearing is a short distance and not a miss.
 */
export function fold(word: string): string {
  return word
    .replace(/ph/g, "f").replace(/w/g, "v").replace(/q/g, "k").replace(/z/g, "j")
    .replace(/c(?=[eiy])/g, "s").replace(/c(?!h)/g, "k")
    .replace(/(kh|gh|bh|dh|th)/g, (m) => m[0])
    .replace(/sh/g, "s")
    .replace(/ee/g, "i").replace(/oo/g, "u").replace(/aa/g, "a")
    .replace(/(.)\1+/g, "$1")
    .replace(/y$/, "i");
}

const SHORT_WORD = 4;
const LONG_WORD = 7;

/** How far, in folded letters, a word may be from another and still be taken for it. A short word has to start the same. */
export function foldLimit(length: number): number {
  if (length < 3) return 0;
  return length >= LONG_WORD ? 2 : 1;
}

export const mustStartTheSame = (length: number): boolean => length <= SHORT_WORD;
