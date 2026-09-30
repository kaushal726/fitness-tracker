# EatRight — simple calorie tracking with a big Indian food dataset

Log what you ate in a few taps. The app works out calories, protein, carbs, fat and fibre from a local
dataset of Indian and global foods, and shows how the day is going against a calorie goal.
Everything stays on the phone (IndexedDB); there is no backend.

The idea is **Food → Serving → Nutrition**: a food stores its nutrition once per 100 g, a serving is just a
named weight ("1 dosa" = 80 g), and every quantity someone types is turned into grams and scaled. Nothing is
stored per quantity, so `1 dosa`, `2 dosa`, `100 g dosa` and `1 plate dosa` all work from the same record.

```
npm install
npm run dev              # the app, at http://localhost:8790
npm test                 # dataset, search and calculation tests
npm run validate:foods   # dataset quality checks
npm run validate:quotes  # checks on the daily thoughts
npm run build:index      # refresh data/food-index.json after adding foods
npm run stats:foods      # print dataset statistics (add --write to refresh this README)
npm run build            # typecheck + production build
```

> Nutrition values are **approximate**. Recipes, oil, portion size and brand change real numbers a lot, and
> restaurant food varies most. Each food carries `nutritionConfidence` and `variability` so the app can say so.
> This is an estimation tool, not medical advice.

## The app

Opens straight on its first screen, with no opening animation. A new person first gets a setup that asks **one question at a time** (name, gender, age, height, weight,
goal, target, timeline, activity) and ends on the daily plan. After that there are three places, plus one big button:

| | |
|---|---|
| **Today** | Calories in a ring, the four macros, a strip of days to switch between, and four meal cards that fold away like an accordion: the meal you are in is open, the rest are one line with their total, and food added to a folded meal opens it. |
| **History** | The week as seven bars against the goal, then every logged day. |
| **Profile** | The plan, goal and body (change one answer at a time), meal times, theme, backup, About, and today's thought as a faded line at the very bottom. |
| **Add food** | Always in the bottom bar. One page, never a sheet on a sheet: the whole screen on a phone, a single dialog on a larger one. Search, shortcuts to common foods, favourites, recents, or browse by category (narrowed by type of food). **Tap a food and its amount card opens right there in the list**: the amount (stepper, one-tap 1-5, unit), what it comes to, and one button, so three chapatis are one entry, not three taps. A row says how you last had that food, which is where the card starts. "Adding to Dinner" under the title changes the meal for what is added next. The page stays open for several foods; the bar at the foot (*Review or edit*) lists them all, and any can be changed or taken out in place before Done. Phone Back or Escape steps out of a category, the list or the form before it closes the page. On a computer the amount field is focused: type a number and press Enter. |

The timeline accepts any number of days, weeks or months. Height can be typed in centimetres or feet and inches.

**Design system.** Colours, sizes and motion come from `src/styles/tokens.css` (light and dark). Components live in
`src/ui/`, icons (Lucide) are named in `src/ui/icons.ts`, and the typeface is Plus Jakarta Sans, bundled with the app so
it works offline. Motion is skipped for people who ask their device for less of it. Sheets are their own layer: lighter than the page in dark mode (dimming a dark page shows nothing) and a tall sheet leaves a strip of the page above it. Nothing opens on top of a sheet: a flow that needs more than one view (Add food) keeps them inside one surface.

**Code.** `src/nutrition/` is the food engine, `src/domain/` is the maths (goals, timeline, meals, portions), `src/data/`
is storage (IndexedDB), `src/quotes/` picks the daily thought, and `src/features/` holds one folder per screen.

## Dataset

<!-- stats:start -->

**Total foods: 3783** (153 composite, 3630 simple)

**By category**

| Category | Foods |
|---|---|
| Main Course | 1372 |
| Drinks | 339 |
| Snacks | 314 |
| Breakfast | 236 |
| Sweets | 205 |
| Condiments & Cooking | 192 |
| Vegetables | 150 |
| Staples & Grains | 137 |
| Protein Foods | 136 |
| Chinese | 127 |
| Fast Food | 127 |
| Dairy & Eggs | 87 |
| Fruits | 84 |
| Bakery | 82 |
| Packaged Food | 78 |
| Desserts | 65 |
| Nuts & Seeds | 42 |
| Supplements | 10 |

**By cuisine**

| Cuisine | Foods |
|---|---|
| pan_indian | 1513 |
| global | 301 |
| north_indian | 210 |
| tamil | 176 |
| punjabi | 142 |
| bengali | 135 |
| kerala | 134 |
| maharashtrian | 110 |
| south_indian | 93 |
| american | 90 |
| indo_chinese | 87 |
| gujarati | 77 |
| andhra_telangana | 75 |
| karnataka | 52 |
| continental | 48 |
| hyderabadi | 48 |
| mughlai | 48 |
| goan | 44 |
| italian | 37 |
| rajasthani | 36 |
| bihari_jharkhand | 33 |
| middle_eastern | 33 |
| odia | 30 |
| nepali_tibetan | 27 |
| kashmiri | 23 |
| mangalorean | 21 |
| japanese_korean | 18 |
| sindhi | 17 |
| assamese | 16 |
| awadhi | 16 |
| northeastern | 16 |
| parsi | 16 |
| mexican | 14 |
| himachali | 12 |
| malvani | 12 |
| uttarakhandi | 11 |
| chettinad | 7 |
| chinese | 3 |
| anglo_indian | 2 |

**By food type**

| Food type | Foods |
|---|---|
| vegan | 1588 |
| vegetarian | 1330 |
| non_vegetarian | 711 |
| eggetarian | 154 |

**By confidence**

| Confidence | Foods |
|---|---|
| medium | 2971 |
| low | 465 |
| high | 347 |

**By variability**

| Variability | Foods |
|---|---|
| medium | 2273 |
| low | 1048 |
| high | 462 |

**By data source**

| Data source | Foods |
|---|---|
| recipe_based | 2652 |
| standard_reference | 621 |
| estimated | 510 |

**Serving units:** `g` (mass), `kg` (mass), `ml` (volume), `litre` (volume), `tsp` (volume), `tbsp` (volume), `cup` (volume), `glass` (volume), `katori` (volume), `bowl` (volume), `bottle` (volume), `can` (volume), `peg` (volume), `piece` (count), `slice` (count), `plate` (count), `serving` (count), `handful` (count), `scoop` (count), `pinch` (count), `packet` (count), `roti` (count, = piece), `paratha` (count, = piece), `dosa` (count, = piece), `idli` (count, = piece), `vada` (count, = piece), `samosa` (count, = piece), `egg` (count, = piece), `banana` (count, = piece), `apple` (count, = piece), `orange` (count, = piece), `mango` (count, = piece), `breast` (count, = piece)

<!-- stats:end -->

## Layout

```
data/
  foods/*.json          the foods, grouped by cuisine / kind (edit these)
  categories.json       categories, sub-categories, cuisines, tags and the other allowed values
  serving-units.json    the central unit table (g, ml, cup, katori, tbsp, piece, roti, dosa...)
  popular-foods.json    commonly eaten foods, most common first (search ranking only)
  food-index.json       generated light index of every food (npm run build:index)
  quotes/*.json         the daily thoughts, one file per theme (edit these)
src/nutrition/          types, loader, unit conversion, calculation, search, validation
src/quotes/             the quote of the day, validation
scripts/                validate-foods, validate-quotes, build-index, stats
```

## A food

```jsonc
{
  "id": "plain_dosa",                       // permanent: logs point at it. Never rename, add a new food instead.
  "name": "Plain Dosa",
  "aliases": ["dosa", "sada dosa", "dosai"],  // what people type; feeds search
  "subCategory": "south_indian",            // category comes from the file's "defaults" (or set "category" here)
  "servingOptions": [                       // the first one is the default serving
    { "label": "1 dosa",  "unit": "piece", "grams": 80 },
    { "label": "2 dosa",  "unit": "plate", "grams": 160 }
  ],
  "nutritionPer100g": { "calories": 168, "protein": 3.9, "carbohydrates": 29.5, "fat": 4, "fiber": 1.2, "sugar": 0.5, "sodium": 180 },
  "nutritionConfidence": "medium",          // high | medium | low
  "dataSourceType": "recipe_based",         // standard_reference | estimated | recipe_based
  "variability": "low",                     // low | medium | high
  "tags": ["contains_gluten"]               // optional; see below
}
```

**Nutrition fields:** `calories` (kcal), `protein`, `carbohydrates`, `fat`, `fiber`, `sugar` (grams) and `sodium` (mg) on every food;
`saturatedFat`, `transFat` (grams) and `cholesterol` (mg) are optional.

Each file starts with `defaults` (`category`, `cuisine`, `foodType`, `nutritionConfidence`, `dataSourceType`,
`variability`, `mealTypes`, `tags`) that every food in it inherits unless it sets its own. On load the app fills in
`nutritionPerServing`, `searchableText` (name + aliases + category + cuisine + tags), meal types and the derived
tags. Meal types are only a hint (an egg belongs to every meal); the app decides the meal from the clock.

**Tags** are classification, not health claims. `vegetarian`, `vegan`, `non_vegetarian` come from `foodType`;
`high_protein`, `high_fiber`, `low_calorie`, `high_calorie`, `low_fat`, `high_fat`, `low_carb`, `high_carb` and
`sugar_free` are derived from the numbers (thresholds in `src/nutrition/constants.ts`); `contains_dairy`,
`contains_egg`, `contains_gluten`, `contains_nuts` and `spicy` are written by hand.

### Variability

Foods that differ a lot between kitchens (paneer butter masala, biryani, cold coffee) are marked
`"variability": "high"` and can carry an `estimateRange` for a 100 g portion, where `typical` must equal the stored value:

```json
"estimateRange": { "calories": { "low": 150, "typical": 200, "high": 280 } }
```

### Composite foods

A composite food is built from other foods. Its nutrition is the sum of its ingredients, per 100 g of the finished dish,
so changing an ingredient updates every composite that uses it (`data/foods/composite.json`):

```json
{ "id": "protein_shake", "type": "composite", "name": "Protein Shake", "aliases": ["gym shake"],
  "category": "drinks", "subCategory": "shake",
  "servingOptions": [{ "label": "1 shake", "unit": "glass" }],
  "ingredients": [{ "foodId": "whey_protein", "quantity": 1, "unit": "scoop" }, { "foodId": "milk", "quantity": 250, "unit": "ml" }] }
```

### Branded foods

All foods here are generic. Brand names appear only as search aliases ("maggi" finds *Instant Noodles*). When a brand's
own label values are wanted, add a **separate** food with a `brand` field and its label numbers; never overwrite a
generic entry with brand data.

## How calculation works

`quantity × unit` becomes grams, then grams scale the per-100 g values (`src/nutrition/calculate.ts`):

1. The unit text is normalised (`"Cups"`, `"chapati"`, `"gms"` → a unit id) using `serving-units.json`.
2. If the **food** lists a serving with that unit, its grams win (`1 katori` of rice = 150 g).
3. Otherwise the generic table applies: mass units are exact (`g`, `kg`); volume units are millilitres × the food's
   `densityGPerMl` (default 1), so `250 ml` of milk is 257.5 g; count units (`piece`, `plate`, `slice`...) have no
   generic size, so the food must define them, otherwise you get a clear `FoodCalcError` (`unsupported_unit`).
4. Nutrition = per-100 g × grams ÷ 100. Sums are added unrounded and rounded once (calories to 1 kcal, macros to 0.1 g).

```ts
import { calculateNutrition, calculateMealNutrition, calculateDailyNutrition, searchFood } from "./src/nutrition/index.ts";

calculateNutrition("plain_dosa", 2, "piece");   // { calories: 269, protein: 6.2, carbs: 47.2, fat: 6.4, fiber: 1.9, sugar: 0.8, sodium: 288 }
calculateNutrition("chicken_breast", 200, "g"); // { calories: 330, protein: 62, carbs: 0, fat: 7.2, ... }
calculateNutrition("diet_cola", 250, "ml");     // { calories: 0, ... }

calculateMealNutrition([{ foodId: "egg_boiled", quantity: 2, unit: "egg" }, { foodId: "roti", quantity: 2, unit: "chapati" }]);
calculateDailyNutrition(meals, { calories: 2200, protein: 130, carbs: 250, fat: 70, fiber: 30, sugar: 50, sodium: 2300 });
// → per-meal totals, the day's totals, and `remaining` against the targets

searchFood("chilli chicken");                    // ranked foods; aliases, word order and small typos are understood
```

## Search

`searchFood(query, options)` ranks: exact name > exact alias > the name starts with what was typed > every typed word is a
word of the name > a nickname (alias) starts with it > every word matches (alias, then any searchable text; plurals are
ignored) > close spelling. On top of that it adds a bonus for commonly eaten foods (`popular-foods.json`, which also decides
what comes first when browsing a category), the user's favourites and recents (pass their ids), and prefers shorter names.
A few alternate spellings count as one word (`daal` = `dal`, `laddu` = `ladoo`, `chat` = `chaat`; see `SPELLING_VARIANTS`
in `src/nutrition/text.ts`).
Options: `limit`, `category`, `cuisine`, `foodType`, `tag`, `recentIds`, `favoriteIds`, `extraFoods` (user-created foods).

## Loading the food data

The foods are one lazy chunk (`src/nutrition/dataFiles.ts`, about 1.5 MB, 244 KB gzipped), so the app opens without waiting
for them. The registry is empty until `await loadFoods()`: the app starts it in the background, and the Add page and the Edit sheet
show a loading skeleton, or a "try again" button if the download failed, until it is ready. Scripts and tests call
`loadFoods()` first; `getAllFoods`, `getFoodById` and the other getters throw if they are used before it finishes. In the
Add page a big category is narrowed with sub-category chips and shown 30 at a time.

## Adding and changing foods

**Add a food:** open the right file in `data/foods/`, add one line to `foods`, then run
`npm run validate:foods && npm run build:index`. Give it a snake_case `id`, 3+ aliases people really type, at least one
serving option, and per-100 g values. Use a `sub` category that exists under its category in `categories.json`
(add new categories/cuisines/tags there first). Prefer the cooked or as-eaten state, and add separate foods for
different preparations (raw / boiled / fried) rather than one blended entry.

**Change a food:** edit its numbers or aliases in place. Never change an `id` (saved logs use it); to retire a food, leave
it and add its replacement.

**Add a file:** create `data/foods/<name>.json` (copy the `defaults` header from another) and list it in
`src/nutrition/dataFiles.ts`. A test fails if a data file is missing from that list.

## How validation works

`npm run validate:foods` (also run by `npm test`) checks every food and prints each problem with its file and id.
**Errors** fail the run: duplicate ids or names, missing/negative/non-numeric nutrition, invalid category, sub-category,
cuisine, food type, tag, meal type, confidence, source or variability, unknown serving units, two servings with the same
unit, impossible serving sizes, macros adding to more than 100 g, fibre or sugar above carbohydrates, a vegan food tagged
dairy/egg, an `estimateRange` that disagrees with the stored value, composites with unresolvable ingredients,
`popular-foods.json` ids that do not exist, and calories far from what the macros give.
**Warnings** ask for a look: no aliases, very high sodium, and a moderate calorie/macro gap. The calorie check uses
protein×4 + (carbs−fibre)×4 + fibre×2 + fat×9 and is loose on purpose, since fibre, rounding and water content are real.

## Daily thought

One short line about eating well, once a day. It is a quiet reminder that food matters, so it is kept out of the way: it
lives at the very bottom of **Profile**, just above the credit, as a single small line in faded text. Nothing else shows
it: not Today, not History, not the opening screen, and there is no notification.

**Which quote, on which day.** `quoteForDay(date)` in `src/quotes/daily.ts` takes the quotes in a fixed order (sorted by a
hash of the id, then nudged so two neighbours never share a theme) and walks through it one a day. Everyone sees the same
thought on the same date, nothing repeats until every quote has had a turn, and it needs no server or saved history.

**The collection.** `data/quotes/<theme>.json`, one file per theme, each line `{ "id": "fuel_001", "text": "…" }` with
optional `by` (who said it) and `gloss` (an English rendering, required for lines in another language). Most lines are
written for this app; a few are proverbs or well-sourced quotes (attributed, kept under 10%). Aim for calm and specific:
no shaming, no promises, no food moralising, no emoji.

**Add a quote:** add one line to a theme file with the next id, then run `npm run validate:quotes`. It checks id format
and uniqueness, length (12–160 characters), sentence ending, emoji, near-duplicates (shared-word similarity), a gloss for
non-English lines, at least 366 quotes in all, and the share of attributed lines. **Add a theme:** create
`data/quotes/<theme>.json` (theme, label, quotes) and list it in `src/quotes/dataFiles.ts`; a test fails if a file is missing.
Never change or reuse an id.

## Deploy

The app is a static site. `.github/workflows/deploy.yml` publishes it to GitHub Pages every time `master` changes, and only
then (no other branch, pull request or manual run deploys): it installs, runs the tests, builds with `BASE_PATH=/<repo>/` and
uploads `dist/`. The site is then at `https://<user>.github.io/<repo>/`. A failing test stops the deploy and leaves the live
site as it was.

One-time setup on GitHub: **Settings → Pages → Source: GitHub Actions**, and make `master` the default branch. For a custom
domain or a `<user>.github.io` repository, set `BASE_PATH` to `/` in the workflow.

To look at the deployed build locally, stop `npm run dev` (both use port 8790) and run:

```
BASE_PATH=/fitness-tracker/ npm run build
BASE_PATH=/fitness-tracker/ npm run preview   # then open http://localhost:8790/fitness-tracker/
```
