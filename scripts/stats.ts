/* npm run stats:foods — prints dataset statistics. With --write, refreshes the block between the
 * stats markers in README.md.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import categoriesJson from "../data/categories.json" with { type: "json" };
import { getAllFoods, loadFoods } from "../src/nutrition/registry.ts";
import { UNITS } from "../src/nutrition/units.ts";
import type { Food } from "../src/nutrition/types.ts";

const README = fileURLToPath(new URL("../README.md", import.meta.url));
const START = "<!-- stats:start -->";
const END = "<!-- stats:end -->";
await loadFoods();
const foods = getAllFoods();

function table(title: string, rows: [string, number][]): string {
  const body = rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `| ${k} | ${v} |`).join("\n");
  return `**By ${title.toLowerCase()}**\n\n| ${title} | Foods |\n|---|---|\n${body}\n`;
}

function countBy(key: (f: Food) => string, label?: (k: string) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const f of foods) counts.set(key(f), (counts.get(key(f)) ?? 0) + 1);
  return [...counts].map(([k, v]) => [label?.(k) ?? k, v]);
}

const categoryLabel = (id: string) => (categoriesJson.categories as Record<string, { label: string }>)[id]?.label ?? id;
const unitList = Object.entries(UNITS).map(([id, u]) => `\`${id}\` (${u.kind}${u.aliasOf ? `, = ${u.aliasOf}` : ""})`).join(", ");

const text = [
  `**Total foods: ${foods.length}** (${foods.filter((f) => f.type === "composite").length} composite, ${foods.filter((f) => f.type === "simple").length} simple)\n`,
  table("Category", countBy((f) => f.category, categoryLabel)),
  table("Cuisine", countBy((f) => f.cuisine)),
  table("Food type", countBy((f) => f.foodType)),
  table("Confidence", countBy((f) => f.nutritionConfidence)),
  table("Variability", countBy((f) => f.variability)),
  table("Data source", countBy((f) => f.dataSourceType)),
  `**Serving units:** ${unitList}\n`,
].join("\n");

if (process.argv.includes("--write")) {
  const readme = fs.readFileSync(README, "utf8");
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) throw new Error("README.md has no stats markers");
  fs.writeFileSync(README, `${readme.slice(0, start + START.length)}\n\n${text}\n${readme.slice(end)}`);
  console.log("README.md stats refreshed");
} else console.log(text);
