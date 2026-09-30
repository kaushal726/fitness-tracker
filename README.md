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

Opens with a short animation, then a setup that asks **one question at a time** (name, gender, age, height, weight,
goal, target, timeline, activity) and ends on the daily plan. After that there are three places, plus one big button:

| | |
|---|---|
| **Today** | Calories in a ring, the four macros, a strip of days to switch between, and four meal cards. |
| **History** | The week as seven bars against the goal, today's thought, then every logged day. |
| **Profile** | The plan, goal and body (change one answer at a time), meal times, theme, the daily thought switch, backup, About. |
| **Add food** | Always in the bottom bar. Search, quick add, favourites, recents, or browse by category; tap `+` on a row for one usual serving, or tap the row to choose the amount, unit and meal. |

The timeline accepts any number of days, weeks or months. Height can be typed in centimetres or feet and inches.

**Design system.** Colours, sizes and motion come from `src/styles/tokens.css` (light and dark). Components live in
`src/ui/`, icons (Lucide) are named in `src/ui/icons.ts`, and the typeface is Plus Jakarta Sans, bundled with the app so
it works offline. Motion is skipped for people who ask their device for less of it.

**Code.** `src/nutrition/` is the food engine, `src/domain/` is the maths (goals, timeline, meals, portions), `src/data/`
is storage (IndexedDB), `src/quotes/` picks the daily thought, and `src/features/` holds one folder per screen.

## Dataset

<!-- stats:start -->

**Total foods: 1080** (23 composite, 1057 simple)

**By category**

| Category | Foods |
|---|---|
| Main Course | 234 |
| Snacks | 99 |
| Drinks | 90 |
| Breakfast | 82 |
| Fast Food | 69 |
| Protein Foods | 68 |
| Vegetables | 65 |
| Chinese | 56 |
| Sweets | 53 |
| Condiments & Cooking | 42 |
| Dairy & Eggs | 36 |
| Fruits | 33 |
| Staples & Grains | 33 |
| Nuts & Seeds | 29 |
| Packaged Food | 28 |
| Desserts | 27 |
| Bakery | 26 |
| Supplements | 10 |

**By cuisine**

| Cuisine | Foods |
|---|---|
| pan_indian | 540 |
| global | 81 |
| indo_chinese | 56 |
| north_indian | 53 |
| south_indian | 46 |
| american | 37 |
| bengali | 37 |
| kerala | 29 |
| maharashtrian | 26 |
| punjabi | 26 |
| gujarati | 22 |
| bihari_jharkhand | 18 |
| italian | 18 |
| rajasthani | 16 |
| tamil | 14 |
| andhra_telangana | 11 |
| karnataka | 11 |
| hyderabadi | 9 |
| mughlai | 7 |
| goan | 5 |
| mexican | 5 |
| middle_eastern | 5 |
| kashmiri | 4 |
| odia | 4 |

**By food type**

| Food type | Foods |
|---|---|
| vegan | 481 |
| vegetarian | 376 |
| non_vegetarian | 171 |
| eggetarian | 52 |

**By confidence**

| Confidence | Foods |
|---|---|
| medium | 563 |
| low | 287 |
| high | 230 |

**By variability**

| Variability | Foods |
|---|---|
| low | 580 |
| medium | 253 |
| high | 247 |

**By data source**

| Data source | Foods |
|---|---|
| recipe_based | 631 |
| standard_reference | 275 |
| estimated | 174 |

**Serving units:** `g` (mass), `kg` (mass), `ml` (volume), `litre` (volume), `tsp` (volume), `tbsp` (volume), `cup` (volume), `glass` (volume), `katori` (volume), `bowl` (volume), `bottle` (volume), `can` (volume), `piece` (count), `slice` (count), `plate` (count), `serving` (count), `handful` (count), `scoop` (count), `packet` (count), `roti` (count, = piece), `paratha` (count, = piece), `dosa` (count, = piece), `idli` (count, = piece), `vada` (count, = piece), `samosa` (count, = piece), `egg` (count, = piece), `banana` (count, = piece), `apple` (count, = piece), `orange` (count, = piece), `mango` (count, = piece), `breast` (count, = piece)

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
src/quotes/             the quote of the day, the opening-screen rule, validation
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

`searchFood(query, options)` ranks: exact name > exact alias > name prefix > alias prefix > every word matches
(name, then alias, then any searchable text; plurals are ignored) > close spelling. On top of that it adds a bonus for commonly eaten
foods (`popular-foods.json`), the user's favourites and recents (pass their ids), and prefers shorter names.
Options: `limit`, `category`, `cuisine`, `foodType`, `tag`, `recentIds`, `favoriteIds`, `extraFoods` (user-created foods).

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

## Daily thoughts

One short line about eating well, once a day. It is meant to be a quiet reminder that food matters, so it is kept
out of the way: **never on Today**, not a notification, and not more than once.

- **When the app opens.** The first launch of each day shows the thought under the name on the opening screen for a few
  seconds. Tap *Continue*, or press Enter or Escape, to move on early. Opening the app again the same day shows nothing.
  Nobody who is still in setup sees it, and people who asked their device for less motion get no opening screen at all.
- **On History.** Today's thought sits under the week chart, with *Show another* for anyone who wants more.
- **Off switch.** Profile → Preferences → *Daily thought* turns both off. The choice, and the day it was last shown, are
  stored with the other settings (`dailyThought`, `lastThoughtDate`).

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
