/* Every data file, imported statically so it works in Vite and in Node scripts alike.
 * Adding a file? Add it here (a test fails if a data/foods/*.json file is missing from this list).
 * `composite` must stay last: it refers to foods in the others.
 */
import type { RawFile } from "./types.ts";
import bakery from "../../data/foods/bakery.json" with { type: "json" };
import bengali from "../../data/foods/bengali.json" with { type: "json" };
import bihariJharkhand from "../../data/foods/bihari-jharkhand.json" with { type: "json" };
import breakfast from "../../data/foods/breakfast.json" with { type: "json" };
import chinese from "../../data/foods/chinese.json" with { type: "json" };
import condiments from "../../data/foods/condiments.json" with { type: "json" };
import dairy from "../../data/foods/dairy.json" with { type: "json" };
import desserts from "../../data/foods/desserts.json" with { type: "json" };
import drinks from "../../data/foods/drinks.json" with { type: "json" };
import fastFood from "../../data/foods/fast-food.json" with { type: "json" };
import fruits from "../../data/foods/fruits.json" with { type: "json" };
import gujarati from "../../data/foods/gujarati.json" with { type: "json" };
import indianMainCourse from "../../data/foods/indian-main-course.json" with { type: "json" };
import maharashtrian from "../../data/foods/maharashtrian.json" with { type: "json" };
import northIndian from "../../data/foods/north-indian.json" with { type: "json" };
import nutsSeeds from "../../data/foods/nuts-seeds.json" with { type: "json" };
import packagedFood from "../../data/foods/packaged-food.json" with { type: "json" };
import protein from "../../data/foods/protein.json" with { type: "json" };
import rajasthani from "../../data/foods/rajasthani.json" with { type: "json" };
import regionalSouth from "../../data/foods/regional-south.json" with { type: "json" };
import snacks from "../../data/foods/snacks.json" with { type: "json" };
import southIndian from "../../data/foods/south-indian.json" with { type: "json" };
import staples from "../../data/foods/staples.json" with { type: "json" };
import streetFood from "../../data/foods/street-food.json" with { type: "json" };
import supplements from "../../data/foods/supplements.json" with { type: "json" };
import sweets from "../../data/foods/sweets.json" with { type: "json" };
import vegetables from "../../data/foods/vegetables.json" with { type: "json" };
import composite from "../../data/foods/composite.json" with { type: "json" };

export const DATA_FILES: { name: string; data: RawFile }[] = [
  { name: "bakery", data: bakery as RawFile },
  { name: "bengali", data: bengali as RawFile },
  { name: "bihari-jharkhand", data: bihariJharkhand as RawFile },
  { name: "breakfast", data: breakfast as RawFile },
  { name: "chinese", data: chinese as RawFile },
  { name: "condiments", data: condiments as RawFile },
  { name: "dairy", data: dairy as RawFile },
  { name: "desserts", data: desserts as RawFile },
  { name: "drinks", data: drinks as RawFile },
  { name: "fast-food", data: fastFood as RawFile },
  { name: "fruits", data: fruits as RawFile },
  { name: "gujarati", data: gujarati as RawFile },
  { name: "indian-main-course", data: indianMainCourse as RawFile },
  { name: "maharashtrian", data: maharashtrian as RawFile },
  { name: "north-indian", data: northIndian as RawFile },
  { name: "nuts-seeds", data: nutsSeeds as RawFile },
  { name: "packaged-food", data: packagedFood as RawFile },
  { name: "protein", data: protein as RawFile },
  { name: "rajasthani", data: rajasthani as RawFile },
  { name: "regional-south", data: regionalSouth as RawFile },
  { name: "snacks", data: snacks as RawFile },
  { name: "south-indian", data: southIndian as RawFile },
  { name: "staples", data: staples as RawFile },
  { name: "street-food", data: streetFood as RawFile },
  { name: "supplements", data: supplements as RawFile },
  { name: "sweets", data: sweets as RawFile },
  { name: "vegetables", data: vegetables as RawFile },
  { name: "composite", data: composite as RawFile },
];
