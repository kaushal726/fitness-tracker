/* npm run validate:foods — prints every issue, exits 1 if any is an error. */
import { getAllFoods, loadFoods } from "../src/nutrition/registry.ts";
import { validateDataset } from "../src/nutrition/validation.ts";

await loadFoods();
const issues = validateDataset();
const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");

for (const i of [...errors, ...warnings]) console.log(`${i.level === "error" ? "ERROR  " : "warning"}  ${i.file}/${i.id}: ${i.message}`);
console.log(`\n${getAllFoods().length} foods checked: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
