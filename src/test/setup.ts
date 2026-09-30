/* Runs before every test file: the food data is a lazy chunk in the app, so tests load it up front. */
import { loadFoods } from "../nutrition/registry.ts";

await loadFoods();
