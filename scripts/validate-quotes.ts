/* npm run validate:quotes — prints every issue, exits 1 if any is an error. */
import { QUOTES } from "../src/quotes/library.ts";
import { validateQuotes } from "../src/quotes/validation.ts";

const issues = validateQuotes();
const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");

for (const i of [...errors, ...warnings]) console.log(`${i.level === "error" ? "ERROR  " : "warning"}  ${i.file}/${i.id}: ${i.message}`);
console.log(`\n${QUOTES.length} quotes checked: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
