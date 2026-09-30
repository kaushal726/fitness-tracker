/* npm run build:index — writes data/food-index.json, a light list (no nutrition) for fast lookups
 * and for checking that ids stay stable between releases.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getAllFoods } from "../src/nutrition/registry.ts";

const OUT = fileURLToPath(new URL("../data/food-index.json", import.meta.url));

const index = getAllFoods().map((f) => ({
  id: f.id,
  name: f.name,
  category: f.category,
  subCategory: f.subCategory,
  cuisine: f.cuisine,
  foodType: f.foodType,
  file: f.sourceFile,
}));

const lines = index.map((f, i) => `  ${JSON.stringify(f)}${i < index.length - 1 ? "," : ""}`);
fs.writeFileSync(OUT, `{\n  "count": ${index.length},\n  "foods": [\n${lines.map((l) => "  " + l).join("\n")}\n  ]\n}\n`);
console.log(`wrote ${index.length} foods to data/food-index.json`);
