/* Every data file, imported statically here so they form ONE lazy chunk: registry.ts loads this module on demand
 * (loadFoods), and Node scripts and tests can import it directly.
 * Adding a file? Add it here (a test fails if a data/foods/*.json file is missing from this list).
 * `composite` must stay last: it refers to foods in the others.
 */
import type { DataFile } from "./types.ts";
import alcoholicBeverages from "../../data/foods/alcoholic-beverages.json" with { type: "json" };
import bakery from "../../data/foods/bakery.json" with { type: "json" };
import bakeryBreadsCakes from "../../data/foods/bakery-breads-cakes.json" with { type: "json" };
import bengali from "../../data/foods/bengali.json" with { type: "json" };
import bengaliOdia from "../../data/foods/bengali-odia.json" with { type: "json" };
import bihariJharkhand from "../../data/foods/bihari-jharkhand.json" with { type: "json" };
import biryani from "../../data/foods/biryani.json" with { type: "json" };
import biscuitsCookies from "../../data/foods/biscuits-cookies.json" with { type: "json" };
import brandedFoods from "../../data/foods/branded-foods.json" with { type: "json" };
import breakfast from "../../data/foods/breakfast.json" with { type: "json" };
import breakfastCombos from "../../data/foods/breakfast-combos.json" with { type: "json" };
import cafeFoods from "../../data/foods/cafe-foods.json" with { type: "json" };
import chaat from "../../data/foods/chaat.json" with { type: "json" };
import chicken from "../../data/foods/chicken.json" with { type: "json" };
import chinese from "../../data/foods/chinese.json" with { type: "json" };
import chineseIndoChineseMore from "../../data/foods/chinese-indo-chinese-more.json" with { type: "json" };
import chutneys from "../../data/foods/chutneys.json" with { type: "json" };
import coffee from "../../data/foods/coffee.json" with { type: "json" };
import coldDrinks from "../../data/foods/cold-drinks.json" with { type: "json" };
import condiments from "../../data/foods/condiments.json" with { type: "json" };
import dairy from "../../data/foods/dairy.json" with { type: "json" };
import dairyCheeseRaita from "../../data/foods/dairy-cheese-raita.json" with { type: "json" };
import dalsPulses from "../../data/foods/dals-pulses.json" with { type: "json" };
import desserts from "../../data/foods/desserts.json" with { type: "json" };
import dinnerCombos from "../../data/foods/dinner-combos.json" with { type: "json" };
import drinks from "../../data/foods/drinks.json" with { type: "json" };
import eastAsian from "../../data/foods/east-asian.json" with { type: "json" };
import eggs from "../../data/foods/eggs.json" with { type: "json" };
import energyDrinks from "../../data/foods/energy-drinks.json" with { type: "json" };
import farsan from "../../data/foods/farsan.json" with { type: "json" };
import fastFood from "../../data/foods/fast-food.json" with { type: "json" };
import fastFoodChains from "../../data/foods/fast-food-chains.json" with { type: "json" };
import fastingVrat from "../../data/foods/fasting-vrat.json" with { type: "json" };
import fishSeafood from "../../data/foods/fish-seafood.json" with { type: "json" };
import floursAtta from "../../data/foods/flours-atta.json" with { type: "json" };
import friedSnacks from "../../data/foods/fried-snacks.json" with { type: "json" };
import fruits from "../../data/foods/fruits.json" with { type: "json" };
import fruitsVarieties from "../../data/foods/fruits-varieties.json" with { type: "json" };
import globalContinental from "../../data/foods/global-continental.json" with { type: "json" };
import grainsCereals from "../../data/foods/grains-cereals.json" with { type: "json" };
import gujarati from "../../data/foods/gujarati.json" with { type: "json" };
import gujaratiRajasthaniMaharashtrian from "../../data/foods/gujarati-rajasthani-maharashtrian.json" with { type: "json" };
import gymFoods from "../../data/foods/gym-foods.json" with { type: "json" };
import himalayanKashmiri from "../../data/foods/himalayan-kashmiri.json" with { type: "json" };
import hindiBelt from "../../data/foods/hindi-belt.json" with { type: "json" };
import iceCreamDesserts from "../../data/foods/ice-cream-desserts.json" with { type: "json" };
import indianBreads from "../../data/foods/indian-breads.json" with { type: "json" };
import indianMainCourse from "../../data/foods/indian-main-course.json" with { type: "json" };
import indianSnacks from "../../data/foods/indian-snacks.json" with { type: "json" };
import indianThali from "../../data/foods/indian-thali.json" with { type: "json" };
import instantFoods from "../../data/foods/instant-foods.json" with { type: "json" };
import juices from "../../data/foods/juices.json" with { type: "json" };
import kebabs from "../../data/foods/kebabs.json" with { type: "json" };
import khichdiKadhi from "../../data/foods/khichdi-kadhi.json" with { type: "json" };
import kidsFoods from "../../data/foods/kids-foods.json" with { type: "json" };
import konkanParsiSindhi from "../../data/foods/konkan-parsi-sindhi.json" with { type: "json" };
import legumesBeans from "../../data/foods/legumes-beans.json" with { type: "json" };
import lunchCombos from "../../data/foods/lunch-combos.json" with { type: "json" };
import maharashtrian from "../../data/foods/maharashtrian.json" with { type: "json" };
import middleEastern from "../../data/foods/middle-eastern.json" with { type: "json" };
import milkDrinks from "../../data/foods/milk-drinks.json" with { type: "json" };
import millets from "../../data/foods/millets.json" with { type: "json" };
import momosMore from "../../data/foods/momos-more.json" with { type: "json" };
import muttonBeefPork from "../../data/foods/mutton-beef-pork.json" with { type: "json" };
import northIndian from "../../data/foods/north-indian.json" with { type: "json" };
import northeast from "../../data/foods/northeast.json" with { type: "json" };
import nutsDryFruits from "../../data/foods/nuts-dry-fruits.json" with { type: "json" };
import nutsSeeds from "../../data/foods/nuts-seeds.json" with { type: "json" };
import oilsFats from "../../data/foods/oils-fats.json" with { type: "json" };
import packagedFood from "../../data/foods/packaged-food.json" with { type: "json" };
import packagedSnacks from "../../data/foods/packaged-snacks.json" with { type: "json" };
import paneer from "../../data/foods/paneer.json" with { type: "json" };
import pickles from "../../data/foods/pickles.json" with { type: "json" };
import protein from "../../data/foods/protein.json" with { type: "json" };
import pulsesBeansRaw from "../../data/foods/pulses-beans-raw.json" with { type: "json" };
import rajasthani from "../../data/foods/rajasthani.json" with { type: "json" };
import rawIngredients from "../../data/foods/raw-ingredients.json" with { type: "json" };
import regionalSouth from "../../data/foods/regional-south.json" with { type: "json" };
import riceDishes from "../../data/foods/rice-dishes.json" with { type: "json" };
import salads from "../../data/foods/salads.json" with { type: "json" };
import saucesDips from "../../data/foods/sauces-dips.json" with { type: "json" };
import shakesSmoothies from "../../data/foods/shakes-smoothies.json" with { type: "json" };
import snackCombos from "../../data/foods/snack-combos.json" with { type: "json" };
import snacks from "../../data/foods/snacks.json" with { type: "json" };
import softDrinks from "../../data/foods/soft-drinks.json" with { type: "json" };
import soups from "../../data/foods/soups.json" with { type: "json" };
import southCurries from "../../data/foods/south-curries.json" with { type: "json" };
import southIndian from "../../data/foods/south-indian.json" with { type: "json" };
import southIndianTiffin from "../../data/foods/south-indian-tiffin.json" with { type: "json" };
import spicesMasalas from "../../data/foods/spices-masalas.json" with { type: "json" };
import sportsDrinks from "../../data/foods/sports-drinks.json" with { type: "json" };
import staples from "../../data/foods/staples.json" with { type: "json" };
import streetFood from "../../data/foods/street-food.json" with { type: "json" };
import supplements from "../../data/foods/supplements.json" with { type: "json" };
import sweets from "../../data/foods/sweets.json" with { type: "json" };
import sweetsMithai from "../../data/foods/sweets-mithai.json" with { type: "json" };
import sweetsRegional from "../../data/foods/sweets-regional.json" with { type: "json" };
import tea from "../../data/foods/tea.json" with { type: "json" };
import vegetables from "../../data/foods/vegetables.json" with { type: "json" };
import vegetablesDry from "../../data/foods/vegetables-dry.json" with { type: "json" };
import vegetablesGravy from "../../data/foods/vegetables-gravy.json" with { type: "json" };
import vegetablesRaw from "../../data/foods/vegetables-raw.json" with { type: "json" };
import waterHydration from "../../data/foods/water-hydration.json" with { type: "json" };
import composite from "../../data/foods/composite.json" with { type: "json" };

export const DATA_FILES: DataFile[] = [
  { name: "alcoholic-beverages", data: alcoholicBeverages as DataFile["data"] },
  { name: "bakery", data: bakery as DataFile["data"] },
  { name: "bakery-breads-cakes", data: bakeryBreadsCakes as DataFile["data"] },
  { name: "bengali", data: bengali as DataFile["data"] },
  { name: "bengali-odia", data: bengaliOdia as DataFile["data"] },
  { name: "bihari-jharkhand", data: bihariJharkhand as DataFile["data"] },
  { name: "biryani", data: biryani as DataFile["data"] },
  { name: "biscuits-cookies", data: biscuitsCookies as DataFile["data"] },
  { name: "branded-foods", data: brandedFoods as DataFile["data"] },
  { name: "breakfast", data: breakfast as DataFile["data"] },
  { name: "breakfast-combos", data: breakfastCombos as DataFile["data"] },
  { name: "cafe-foods", data: cafeFoods as DataFile["data"] },
  { name: "chaat", data: chaat as DataFile["data"] },
  { name: "chicken", data: chicken as DataFile["data"] },
  { name: "chinese", data: chinese as DataFile["data"] },
  { name: "chinese-indo-chinese-more", data: chineseIndoChineseMore as DataFile["data"] },
  { name: "chutneys", data: chutneys as DataFile["data"] },
  { name: "coffee", data: coffee as DataFile["data"] },
  { name: "cold-drinks", data: coldDrinks as DataFile["data"] },
  { name: "condiments", data: condiments as DataFile["data"] },
  { name: "dairy", data: dairy as DataFile["data"] },
  { name: "dairy-cheese-raita", data: dairyCheeseRaita as DataFile["data"] },
  { name: "dals-pulses", data: dalsPulses as DataFile["data"] },
  { name: "desserts", data: desserts as DataFile["data"] },
  { name: "dinner-combos", data: dinnerCombos as DataFile["data"] },
  { name: "drinks", data: drinks as DataFile["data"] },
  { name: "east-asian", data: eastAsian as DataFile["data"] },
  { name: "eggs", data: eggs as DataFile["data"] },
  { name: "energy-drinks", data: energyDrinks as DataFile["data"] },
  { name: "farsan", data: farsan as DataFile["data"] },
  { name: "fast-food", data: fastFood as DataFile["data"] },
  { name: "fast-food-chains", data: fastFoodChains as DataFile["data"] },
  { name: "fasting-vrat", data: fastingVrat as DataFile["data"] },
  { name: "fish-seafood", data: fishSeafood as DataFile["data"] },
  { name: "flours-atta", data: floursAtta as DataFile["data"] },
  { name: "fried-snacks", data: friedSnacks as DataFile["data"] },
  { name: "fruits", data: fruits as DataFile["data"] },
  { name: "fruits-varieties", data: fruitsVarieties as DataFile["data"] },
  { name: "global-continental", data: globalContinental as DataFile["data"] },
  { name: "grains-cereals", data: grainsCereals as DataFile["data"] },
  { name: "gujarati", data: gujarati as DataFile["data"] },
  { name: "gujarati-rajasthani-maharashtrian", data: gujaratiRajasthaniMaharashtrian as DataFile["data"] },
  { name: "gym-foods", data: gymFoods as DataFile["data"] },
  { name: "himalayan-kashmiri", data: himalayanKashmiri as DataFile["data"] },
  { name: "hindi-belt", data: hindiBelt as DataFile["data"] },
  { name: "ice-cream-desserts", data: iceCreamDesserts as DataFile["data"] },
  { name: "indian-breads", data: indianBreads as DataFile["data"] },
  { name: "indian-main-course", data: indianMainCourse as DataFile["data"] },
  { name: "indian-snacks", data: indianSnacks as DataFile["data"] },
  { name: "indian-thali", data: indianThali as DataFile["data"] },
  { name: "instant-foods", data: instantFoods as DataFile["data"] },
  { name: "juices", data: juices as DataFile["data"] },
  { name: "kebabs", data: kebabs as DataFile["data"] },
  { name: "khichdi-kadhi", data: khichdiKadhi as DataFile["data"] },
  { name: "kids-foods", data: kidsFoods as DataFile["data"] },
  { name: "konkan-parsi-sindhi", data: konkanParsiSindhi as DataFile["data"] },
  { name: "legumes-beans", data: legumesBeans as DataFile["data"] },
  { name: "lunch-combos", data: lunchCombos as DataFile["data"] },
  { name: "maharashtrian", data: maharashtrian as DataFile["data"] },
  { name: "middle-eastern", data: middleEastern as DataFile["data"] },
  { name: "milk-drinks", data: milkDrinks as DataFile["data"] },
  { name: "millets", data: millets as DataFile["data"] },
  { name: "momos-more", data: momosMore as DataFile["data"] },
  { name: "mutton-beef-pork", data: muttonBeefPork as DataFile["data"] },
  { name: "north-indian", data: northIndian as DataFile["data"] },
  { name: "northeast", data: northeast as DataFile["data"] },
  { name: "nuts-dry-fruits", data: nutsDryFruits as DataFile["data"] },
  { name: "nuts-seeds", data: nutsSeeds as DataFile["data"] },
  { name: "oils-fats", data: oilsFats as DataFile["data"] },
  { name: "packaged-food", data: packagedFood as DataFile["data"] },
  { name: "packaged-snacks", data: packagedSnacks as DataFile["data"] },
  { name: "paneer", data: paneer as DataFile["data"] },
  { name: "pickles", data: pickles as DataFile["data"] },
  { name: "protein", data: protein as DataFile["data"] },
  { name: "pulses-beans-raw", data: pulsesBeansRaw as DataFile["data"] },
  { name: "rajasthani", data: rajasthani as DataFile["data"] },
  { name: "raw-ingredients", data: rawIngredients as DataFile["data"] },
  { name: "regional-south", data: regionalSouth as DataFile["data"] },
  { name: "rice-dishes", data: riceDishes as DataFile["data"] },
  { name: "salads", data: salads as DataFile["data"] },
  { name: "sauces-dips", data: saucesDips as DataFile["data"] },
  { name: "shakes-smoothies", data: shakesSmoothies as DataFile["data"] },
  { name: "snack-combos", data: snackCombos as DataFile["data"] },
  { name: "snacks", data: snacks as DataFile["data"] },
  { name: "soft-drinks", data: softDrinks as DataFile["data"] },
  { name: "soups", data: soups as DataFile["data"] },
  { name: "south-curries", data: southCurries as DataFile["data"] },
  { name: "south-indian", data: southIndian as DataFile["data"] },
  { name: "south-indian-tiffin", data: southIndianTiffin as DataFile["data"] },
  { name: "spices-masalas", data: spicesMasalas as DataFile["data"] },
  { name: "sports-drinks", data: sportsDrinks as DataFile["data"] },
  { name: "staples", data: staples as DataFile["data"] },
  { name: "street-food", data: streetFood as DataFile["data"] },
  { name: "supplements", data: supplements as DataFile["data"] },
  { name: "sweets", data: sweets as DataFile["data"] },
  { name: "sweets-mithai", data: sweetsMithai as DataFile["data"] },
  { name: "sweets-regional", data: sweetsRegional as DataFile["data"] },
  { name: "tea", data: tea as DataFile["data"] },
  { name: "vegetables", data: vegetables as DataFile["data"] },
  { name: "vegetables-dry", data: vegetablesDry as DataFile["data"] },
  { name: "vegetables-gravy", data: vegetablesGravy as DataFile["data"] },
  { name: "vegetables-raw", data: vegetablesRaw as DataFile["data"] },
  { name: "water-hydration", data: waterHydration as DataFile["data"] },
  { name: "composite", data: composite as DataFile["data"] },
];
