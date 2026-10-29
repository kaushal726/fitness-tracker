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
goal, target, timeline, activity) and ends on the daily plan. After that there are five places, plus **Add**, a floating button at the bottom right on phones (at the top of the side bar on a computer):

| | |
|---|---|
| **Today** | Calories in a ring, the four macros, a strip of days to switch between, and four meal cards that fold away like an accordion: the meal you are in is open, the rest are one line with their total, and food added to a folded meal opens it. One line says how the day is going; when it is a warning (over the calories, short of protein late in the day) it has an arrow, and a tap opens a small **Ideas** sheet: foods that would put it right, each a tap from its amount. A share icon in the corner of the calorie card (once something is logged) opens a sheet that asks what goes in the picture of that day: with the foods, or the numbers only. Nothing else is added to this screen. |
| **History** | The week as seven bars against the goal, then every logged day. |
| **Insights** | The month in charts, one card each, with a switch to earlier months. **Month goal**: the budget (the daily goal for every day), how much of it is eaten against an even pace, and the **balance** that carries over: finished days are compared with the goal, what is under or over adds up, and it is spread over the days left, so a heavy day can be made up for on the others (a line chart above and below zero, with a dotted path back to plan; a day is never asked to swing more than 15% down or 10% up, nor below the safe floor). Days with nothing logged, and days with so little logged that they look half-done, are left out rather than counted as zero. Then **Day by day** (a column per day against the goal), **Macros** (a ring of where the calories come from, and each nutrient against its goal), **By meal**, **By weekday** (which days run heavy), **Top foods** and **Consistency** (a calendar of logged days, streaks). When today is off course, **Ideas for today** lists foods that would help. Further down: **Sugar and salt** against the usual limits, **When you eat** (calories by time of day, and which meals were skipped), **What you eat** (by kind of food, cuisine, or plants, egg and meat, with the share that was treats), **Drinks** (water, chai and coffee, sweet drinks, alcohol) and **Highlights**. |
| **Body** | Where the weight stands and where the food is taking it. **Goal progress**: the change since the last weigh-in, estimated from the logged days against what the body uses (about 7,700 kcal to a kilo; days with nothing logged are left out), the daily gap, the pace, and how long to the target at that pace, on a chart that carries on as a dotted line. **BMI** on the usual WHO bands at the estimated weight, with the BMI the target would give; **Energy**; **Week by week**; **Protein** per kilogram. It is an estimate: after a weigh-in, update your weight in Profile and it starts again from the real number. |
| **Profile** | The plan, goal and body (change one answer at a time), meal times, **Share** (today as a picture for a trainer or group, any month as a JSON report for an AI chat; either can leave the foods out with *Numbers only* / *Totals only*; the button at the top of Insights opens the same sheet; your name is left out of the report), theme, **color** (Green, Blue, Purple, Orange, Pink, Teal), **text size** (Small, Medium, Large), backup, About, and today's thought as a faded line at the very bottom. |
| **Add** | The floating button, always there. One page, never a sheet on a sheet: the whole screen on a phone, a single dialog on a larger one. Search, or narrow the list with the row of kinds of food (big ones split again by type). Before anything is typed the list is made from what you have logged: **Your usual breakfast** (or lunch, snack, dinner, to match "Adding to"), the foods you eat most for that meal, lately more than long ago, each with the amount you usually have and a solid round button that **adds it as it is in one tap** (it turns into a tick; the toast has Undo; the text of the row still opens the amount, on the same amount). Foods already in that meal today are left out and the ones that usually come with them are lifted: log a dosa and the sambar you have with it comes up first next time (`src/domain/usuals.ts`). Below it, **More of your foods**: favourites, then what you eat at other meals, then foods you made; common foods for someone with no history yet. The suggestions are worked out when the page opens, so rows never move under your finger while you add. **Tap a food and the page becomes its amount**: a stepper, one-tap 1-5, the unit, what it comes to, and one button, so three chapatis are one entry, not three taps. A row says how you last had that food, which is where the amount starts, and back returns to the same spot in the list. "Adding to Dinner" under the title changes the meal. The page stays open for several foods; the bar at the foot (*Review or edit*) lists what was added, where any item can be opened to change its amount or meal, or taken out, before Done. Phone Back or Escape steps back one page before it closes the flow. On a computer the amount field is focused: type a number and press Enter. |

The timeline accepts any number of days, weeks or months. Height can be typed in centimetres or feet and inches.

**Design system.** Colours, sizes and motion come from `src/styles/tokens.css` (light and dark). The accent colour is a set of `[data-accent]` blocks there, chosen from Color in Profile (`src/app/accent.ts`; `accent.test.ts` keeps them in step and checks the text contrast). Every text size in the stylesheets is its design size times `--fs-scale` (0.9 by default, set from Text size in Profile), so the whole app's text scales from one place; form fields stay at 16px so iOS does not zoom into them. Components live in
`src/ui/`, icons (Lucide) are named in `src/ui/icons.ts`, and the typeface is Plus Jakarta Sans, bundled with the app so
it works offline. **Install pop-up:** on a phone or tablet, in a browser tab (not the installed app), a sheet asks to install it a moment after the app opens (`src/app/InstallSheet.tsx`). Where the browser has its own prompt (Chrome and Edge on Android) the **Install** button opens it; on iPhone and iPad, and Firefox on Android, which have none, it shows the two steps instead (Share, Add to Home Screen). **Not now** is remembered for three days (`src/app/installNudge.ts`); it never shows on a computer or in the installed app. Motion is skipped for people who ask their device for less of it. Sheets are their own layer: lighter than the page in dark mode (dimming a dark page shows nothing) and a tall sheet leaves a strip of the page above it. Nothing opens on top of a sheet: a flow that needs more than one view (Add food) keeps them inside one surface.

**Code.** `src/nutrition/` is the food engine, `src/domain/` is the maths (goals, timeline, meals, portions), `src/data/`
is storage (IndexedDB), `src/quotes/` picks the daily thought, and `src/features/` holds one folder per screen.

## Dataset

<!-- stats:start -->

**Total foods: 8214** (364 composite, 7850 simple)

**By category**

| Category | Foods |
|---|---|
| Main Course | 2278 |
| Chinese | 1095 |
| Drinks | 788 |
| Snacks | 620 |
| Fast Food | 477 |
| Breakfast | 462 |
| Desserts | 408 |
| Sweets | 359 |
| Vegetables | 285 |
| Condiments & Cooking | 272 |
| Packaged Food | 220 |
| Dairy & Eggs | 206 |
| Staples & Grains | 188 |
| Protein Foods | 185 |
| Bakery | 169 |
| Fruits | 143 |
| Nuts & Seeds | 45 |
| Supplements | 14 |

**By cuisine**

| Cuisine | Foods |
|---|---|
| pan_indian | 2662 |
| indo_chinese | 825 |
| american | 531 |
| global | 476 |
| north_indian | 430 |
| tamil | 294 |
| bengali | 249 |
| kerala | 212 |
| punjabi | 209 |
| maharashtrian | 205 |
| nepali_tibetan | 186 |
| karnataka | 166 |
| south_indian | 154 |
| andhra_telangana | 151 |
| jharkhandi | 132 |
| gujarati | 128 |
| italian | 114 |
| continental | 98 |
| chinese | 74 |
| goan | 74 |
| hyderabadi | 74 |
| mughlai | 68 |
| odia | 58 |
| bihari_jharkhand | 45 |
| northeastern | 45 |
| rajasthani | 45 |
| mangalorean | 43 |
| japanese_korean | 41 |
| mexican | 40 |
| middle_eastern | 38 |
| assamese | 34 |
| british | 31 |
| malvani | 31 |
| chettinad | 30 |
| kashmiri | 29 |
| french | 26 |
| awadhi | 18 |
| sindhi | 17 |
| parsi | 16 |
| uttarakhandi | 13 |
| himachali | 12 |
| chhattisgarhi | 11 |
| spanish | 11 |
| eastern_european | 9 |
| german | 9 |
| greek | 8 |
| haryanvi | 8 |
| turkish | 8 |
| southeast_asian | 7 |
| thai | 7 |
| anglo_indian | 4 |
| latin_american | 4 |
| burmese | 2 |
| vietnamese | 2 |

**By food type**

| Food type | Foods |
|---|---|
| vegetarian | 3475 |
| vegan | 2615 |
| non_vegetarian | 1637 |
| eggetarian | 487 |

**By confidence**

| Confidence | Foods |
|---|---|
| medium | 4985 |
| low | 2796 |
| high | 433 |

**By variability**

| Variability | Foods |
|---|---|
| medium | 4259 |
| high | 2347 |
| low | 1608 |

**By data source**

| Data source | Foods |
|---|---|
| recipe_based | 4304 |
| estimated | 3158 |
| standard_reference | 752 |

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

### Variants: "without oil", "without mayonnaise", "less sugar", "with almond milk"

People search for the way they ate a dish, not only its name, so the common dishes also come in the versions they are
asked for. Each variant is its own food, found by the words it is named with and by what people type for it
(`paneer tikka without oil`, `oil free roti`, `veg sandwich no mayo`, `tea with almond milk`, `banana shake no sugar`):

| File | What it holds | How the numbers are made |
|---|---|---|
| `variants-low-oil.json` | *(No Oil)* for tiffin, dal, rice, sabzi and curries; *(Air Fried)* for fried snacks; *(Light)* for rich gravies | the regular food with a share of its fat taken out (60-75% for oil that is only used to cook, 25-55% for foods that keep fat of their own); the weight stays the same |
| `variants-without.json` | *(Without Mayonnaise / Cheese / Butter)* for sandwiches, burgers, wraps, salads, pav bhaji; *(No Sugar / Less Sugar)* for shakes, lassi and sweet drinks | the regular food minus that ingredient's weight, never more than 60% of its fat or 45% of its calories; salads get hung curd instead of mayonnaise |
| `drinks-milk-sugar-variants.json` | tea, coffee, cappuccino, latte, cold coffee, oats and protein shakes with full cream, toned, double toned, skimmed, almond, soy, oat or coconut milk, and with no, less, jaggery, honey or sweetener | composites of the real ingredients |
| `combos-everyday.json` | tea with rusk or biscuits, roti with dal, rice with fish curry, burger and fries, extra cheese pizza... | composites of foods that already exist |

Whole menus were added the same way, by taking an existing dish that is close and moving it by what differs (the sauce, the
main ingredient, the vegetable, the way it is cooked), so a new dish stays in line with its neighbours:

| File | What it holds |
|---|---|
| `chinese-indo-chinese-menu.json` | Indo-Chinese starters (dry) and gravies for chicken, paneer, mushroom, baby corn, gobi, potato, veg, tofu, prawn, fish, egg, mutton, corn, soya, lotus stem in the usual sauces (manchurian, chilli, schezwan, hot garlic, garlic, black pepper, kung pao, sweet and sour, honey chilli, lemon, oyster, salt and pepper, crispy, dragon, ginger, butter garlic, black bean...); noodles and fried rice by type and protein; soups by type and protein |
| `chinese-momos-dimsum-asian.json` | momos by filling and style (steamed, fried, pan fried, tandoori, kurkure, jhol, afghani, schezwan, butter, peri peri, cheese, gravy), dumplings, wontons, gyoza, siu mai, bao, spring rolls, and authentic Chinese, Thai, Japanese, Korean, Malaysian, Tibetan and Burmese dishes written by hand |
| `indian-everyday-expansion.json` | chicken, mutton, fish, prawn, egg, paneer, soya, mushroom and veg in the usual preparations (korma, handi, kadai, bhuna, jalfrezi, tikka masala, saagwala, rogan josh, vindaloo, chettinad, achari, hariyali, kolhapuri, xacuti, roast, sukha...); vegetable versions of paratha, pakora, raita, cutlet, tikki, chilla, sandwich, kofta, thepla, uttapam, wrap, pulao, biryani, masala, fry, sabzi, soup and salad |
| `indian-sweets-snacks-dosa-extras.json` | dosa, idli, kachori, halwa, kheer, ladoo, barfi, chaat, pickle and chutney versions that were missing |

Variants are marked `nutritionConfidence: "low"` and `dataSourceType: "estimated"`: they are good for tracking, not
for a label. A food that already is free of the thing asked for (a sandwich recipe with no mayonnaise) is repeated under
its "without" name with the same numbers, so the search finds it. To add one, copy the pattern: keep the base food's ids,
never edit the base, and give the variant its own id.

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
Hindi phrasing works too: the joining words *ka / ki / ke / wala / wali* are ignored (`besan ka chila`, `bhindi ki sabzi`,
`aloo ke parathe` find Besan Chilla, Bhindi Masala, Aloo Paratha), and `chila`/`cheela`, `parathe`/`parantha`, `pakode`/`pakoda`,
`gobhi`, `sabji`/`subzi` and `rotiyan` are spellings of `chilla`, `paratha`, `pakora`, `gobi`, `sabzi` and `roti`.
Options: `limit`, `category`, `cuisine`, `foodType`, `tag`, `recentIds`, `favoriteIds`, `extraFoods` (user-created foods).

When no food has every word typed ("homemade curd", "1 katori dal"), words that only describe or count are left out, then words no food has, and the closest matches are shown with a note and an **Add it yourself** button (`searchFoodDetailed` says when the list is only the closest). A food of your own (**Add custom food**: name, calories and what one serving is, and under More details protein, carbs, fat, fiber, sugar and sodium) shows in the list with its own delete button, and its amount page has an edit button; if the name typed is already a food, the form offers it instead of a copy. **My foods** in Profile adds, changes and deletes them too.

## Loading the food data

The foods are one lazy chunk (`src/nutrition/dataFiles.ts`, about 4.3 MB, 605 KB gzipped), so the app opens without waiting
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
