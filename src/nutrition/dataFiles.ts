/* Every data file, imported statically here so they form ONE lazy chunk: registry.ts loads this module on demand
 * (loadFoods), and Node scripts and tests can import it directly.
 * Adding a file? Add it here (a test fails if a data/foods/*.json file is missing from this list).
 * `composite` must stay last: it refers to foods in the others.
 */
import type { DataFile } from "./types.ts";
import alcoholicBeverages from "../../data/foods/alcoholic-beverages.json" with { type: "json" };
import bakery from "../../data/foods/bakery.json" with { type: "json" };
import bakeryBreadsCakes from "../../data/foods/bakery-breads-cakes.json" with { type: "json" };
import basDairyMilkCheese from "../../data/foods/bas-dairy-milk-cheese.json" with { type: "json" };
import basDairyRaitaEgg from "../../data/foods/bas-dairy-raita-egg.json" with { type: "json" };
import basFruitsForms from "../../data/foods/bas-fruits-forms.json" with { type: "json" };
import basFruitsFresh from "../../data/foods/bas-fruits-fresh.json" with { type: "json" };
import basProteinFishPlant from "../../data/foods/bas-protein-fish-plant.json" with { type: "json" };
import basProteinMeat from "../../data/foods/bas-protein-meat.json" with { type: "json" };
import basStaplesGrains from "../../data/foods/bas-staples-grains.json" with { type: "json" };
import basStaplesPulses from "../../data/foods/bas-staples-pulses.json" with { type: "json" };
import basVegCooked from "../../data/foods/bas-veg-cooked.json" with { type: "json" };
import basVegRaw from "../../data/foods/bas-veg-raw.json" with { type: "json" };
import bengali from "../../data/foods/bengali.json" with { type: "json" };
import bengaliOdia from "../../data/foods/bengali-odia.json" with { type: "json" };
import bihariJharkhand from "../../data/foods/bihari-jharkhand.json" with { type: "json" };
import bihariMore from "../../data/foods/bihari-more.json" with { type: "json" };
import biryani from "../../data/foods/biryani.json" with { type: "json" };
import biscuitsCookies from "../../data/foods/biscuits-cookies.json" with { type: "json" };
import brandedFoods from "../../data/foods/branded-foods.json" with { type: "json" };
import breakfast from "../../data/foods/breakfast.json" with { type: "json" };
import breakfastCombos from "../../data/foods/breakfast-combos.json" with { type: "json" };
import cafeFoods from "../../data/foods/cafe-foods.json" with { type: "json" };
import chaat from "../../data/foods/chaat.json" with { type: "json" };
import chhattisgarhi from "../../data/foods/chhattisgarhi.json" with { type: "json" };
import chicken from "../../data/foods/chicken.json" with { type: "json" };
import chinese from "../../data/foods/chinese.json" with { type: "json" };
import chineseIndoChineseMore from "../../data/foods/chinese-indo-chinese-more.json" with { type: "json" };
import chnBurgerking from "../../data/foods/chn-burgerking.json" with { type: "json" };
import chnDominos from "../../data/foods/chn-dominos.json" with { type: "json" };
import chnMcdonalds from "../../data/foods/chn-mcdonalds.json" with { type: "json" };
import chnStarbucks from "../../data/foods/chn-starbucks.json" with { type: "json" };
import chnSubway from "../../data/foods/chn-subway.json" with { type: "json" };
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
import dshBakeryBreadsBunsPuffs from "../../data/foods/dsh-bakery-breads-buns-puffs.json" with { type: "json" };
import dshBaseIngredients from "../../data/foods/dsh-base-ingredients.json" with { type: "json" };
import dshBreakfastPohaEggToastBowls from "../../data/foods/dsh-breakfast-poha-egg-toast-bowls.json" with { type: "json" };
import dshCakesCelebration from "../../data/foods/dsh-cakes-celebration.json" with { type: "json" };
import dshCakesLoafEgglessBakes from "../../data/foods/dsh-cakes-loaf-eggless-bakes.json" with { type: "json" };
import dshDessertsPuddingsIceCream from "../../data/foods/dsh-desserts-puddings-ice-cream.json" with { type: "json" };
import dshDrinksAlcohol from "../../data/foods/dsh-drinks-alcohol.json" with { type: "json" };
import dshDrinksColdCafeMocktails from "../../data/foods/dsh-drinks-cold-cafe-mocktails.json" with { type: "json" };
import dshDrinksHotTeaCoffee from "../../data/foods/dsh-drinks-hot-tea-coffee.json" with { type: "json" };
import dshDrinksShakesSmoothiesLassi from "../../data/foods/dsh-drinks-shakes-smoothies-lassi.json" with { type: "json" };
import dshDrinksTraditionalHealthJuices from "../../data/foods/dsh-drinks-traditional-health-juices.json" with { type: "json" };
import dshHealthyDietMeals from "../../data/foods/dsh-healthy-diet-meals.json" with { type: "json" };
import dshSnacksPakoraSamosaHealthy from "../../data/foods/dsh-snacks-pakora-samosa-healthy.json" with { type: "json" };
import dshSnacksSandwichesRollsTikki from "../../data/foods/dsh-snacks-sandwiches-rolls-tikki.json" with { type: "json" };
import easAssamese from "../../data/foods/eas-assamese.json" with { type: "json" };
import easBengaliFish from "../../data/foods/eas-bengali-fish.json" with { type: "json" };
import easBengaliMeatRice from "../../data/foods/eas-bengali-meat-rice.json" with { type: "json" };
import easBengaliStreetSnacks from "../../data/foods/eas-bengali-street-snacks.json" with { type: "json" };
import easBengaliSweets from "../../data/foods/eas-bengali-sweets.json" with { type: "json" };
import easBengaliVegDal from "../../data/foods/eas-bengali-veg-dal.json" with { type: "json" };
import easIngredients from "../../data/foods/eas-ingredients.json" with { type: "json" };
import easNeManipurNagaMizo from "../../data/foods/eas-ne-manipur-naga-mizo.json" with { type: "json" };
import easNeMeghalayaArunachalTripura from "../../data/foods/eas-ne-meghalaya-arunachal-tripura.json" with { type: "json" };
import easOdia from "../../data/foods/eas-odia.json" with { type: "json" };
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
import gloAmericanBreakfast from "../../data/foods/glo-american-breakfast.json" with { type: "json" };
import gloAmericanDesserts from "../../data/foods/glo-american-desserts.json" with { type: "json" };
import gloAmericanFastfood from "../../data/foods/glo-american-fastfood.json" with { type: "json" };
import gloAmericanMains from "../../data/foods/glo-american-mains.json" with { type: "json" };
import gloBritish from "../../data/foods/glo-british.json" with { type: "json" };
import gloGermanFrench from "../../data/foods/glo-german-french.json" with { type: "json" };
import gloItalianDesserts from "../../data/foods/glo-italian-desserts.json" with { type: "json" };
import gloItalianMains from "../../data/foods/glo-italian-mains.json" with { type: "json" };
import gloItalianStarters from "../../data/foods/glo-italian-starters.json" with { type: "json" };
import gloMexican from "../../data/foods/glo-mexican.json" with { type: "json" };
import gloPantry from "../../data/foods/glo-pantry.json" with { type: "json" };
import gloPastaPizza from "../../data/foods/glo-pasta-pizza.json" with { type: "json" };
import gloSpanishGreek from "../../data/foods/glo-spanish-greek.json" with { type: "json" };
import gloTurkishEasteuro from "../../data/foods/glo-turkish-easteuro.json" with { type: "json" };
import globalContinental from "../../data/foods/global-continental.json" with { type: "json" };
import grainsCereals from "../../data/foods/grains-cereals.json" with { type: "json" };
import gujarati from "../../data/foods/gujarati.json" with { type: "json" };
import gujaratiRajasthaniMaharashtrian from "../../data/foods/gujarati-rajasthani-maharashtrian.json" with { type: "json" };
import gymFoods from "../../data/foods/gym-foods.json" with { type: "json" };
import haryanvi from "../../data/foods/haryanvi.json" with { type: "json" };
import himalayanKashmiri from "../../data/foods/himalayan-kashmiri.json" with { type: "json" };
import hindiBelt from "../../data/foods/hindi-belt.json" with { type: "json" };
import iceCreamDesserts from "../../data/foods/ice-cream-desserts.json" with { type: "json" };
import indianBreads from "../../data/foods/indian-breads.json" with { type: "json" };
import indianMainCourse from "../../data/foods/indian-main-course.json" with { type: "json" };
import indianSnacks from "../../data/foods/indian-snacks.json" with { type: "json" };
import indianThali from "../../data/foods/indian-thali.json" with { type: "json" };
import insNoodles from "../../data/foods/ins-noodles.json" with { type: "json" };
import insSoups from "../../data/foods/ins-soups.json" with { type: "json" };
import instantFoods from "../../data/foods/instant-foods.json" with { type: "json" };
import jharkhandiBreadsPitha from "../../data/foods/jharkhandi-breads-pitha.json" with { type: "json" };
import jharkhandiDrinks from "../../data/foods/jharkhandi-drinks.json" with { type: "json" };
import jharkhandiNonveg from "../../data/foods/jharkhandi-nonveg.json" with { type: "json" };
import jharkhandiPlatesMore from "../../data/foods/jharkhandi-plates-more.json" with { type: "json" };
import jharkhandiSaagMore from "../../data/foods/jharkhandi-saag-more.json" with { type: "json" };
import jharkhandiSaagVeg from "../../data/foods/jharkhandi-saag-veg.json" with { type: "json" };
import jharkhandiSweetsFestival from "../../data/foods/jharkhandi-sweets-festival.json" with { type: "json" };
import jharkhandiWildFoods from "../../data/foods/jharkhandi-wild-foods.json" with { type: "json" };
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
import pantryDriedWadi from "../../data/foods/pantry-dried-wadi.json" with { type: "json" };
import pickles from "../../data/foods/pickles.json" with { type: "json" };
import pkdSoftdrinksJuices from "../../data/foods/pkd-softdrinks-juices.json" with { type: "json" };
import pkgBiscuitsParleBritannia from "../../data/foods/pkg-biscuits-parle-britannia.json" with { type: "json" };
import pkgBiscuitsSunfeastOthers from "../../data/foods/pkg-biscuits-sunfeast-others.json" with { type: "json" };
import pkgChipsLaysKurkure from "../../data/foods/pkg-chips-lays-kurkure.json" with { type: "json" };
import pkxDairyAmul from "../../data/foods/pkx-dairy-amul.json" with { type: "json" };
import pkxDairyBrands from "../../data/foods/pkx-dairy-brands.json" with { type: "json" };
import pkxIcecreamAmul from "../../data/foods/pkx-icecream-amul.json" with { type: "json" };
import pkxIcecreamHavmorVadilal from "../../data/foods/pkx-icecream-havmor-vadilal.json" with { type: "json" };
import pkxIcecreamKwalitywalls from "../../data/foods/pkx-icecream-kwalitywalls.json" with { type: "json" };
import pkxIcecreamParlours from "../../data/foods/pkx-icecream-parlours.json" with { type: "json" };
import pkxSoftdrinksCocacola from "../../data/foods/pkx-softdrinks-cocacola.json" with { type: "json" };
import protein from "../../data/foods/protein.json" with { type: "json" };
import pulsesBeansRaw from "../../data/foods/pulses-beans-raw.json" with { type: "json" };
import rajasthani from "../../data/foods/rajasthani.json" with { type: "json" };
import rawIngredients from "../../data/foods/raw-ingredients.json" with { type: "json" };
import regionalSouth from "../../data/foods/regional-south.json" with { type: "json" };
import riceDishes from "../../data/foods/rice-dishes.json" with { type: "json" };
import salads from "../../data/foods/salads.json" with { type: "json" };
import saucesDips from "../../data/foods/sauces-dips.json" with { type: "json" };
import shakesSmoothies from "../../data/foods/shakes-smoothies.json" with { type: "json" };
import siaAndhraCondiments from "../../data/foods/sia-andhra-condiments.json" with { type: "json" };
import siaAndhraCurries from "../../data/foods/sia-andhra-curries.json" with { type: "json" };
import siaAndhraNonveg from "../../data/foods/sia-andhra-nonveg.json" with { type: "json" };
import siaAndhraSnacksSweets from "../../data/foods/sia-andhra-snacks-sweets.json" with { type: "json" };
import siaAndhraTiffin from "../../data/foods/sia-andhra-tiffin.json" with { type: "json" };
import siaHyderabadiMain from "../../data/foods/sia-hyderabadi-main.json" with { type: "json" };
import siaHyderabadiSnacksSweets from "../../data/foods/sia-hyderabadi-snacks-sweets.json" with { type: "json" };
import siaKarnatakaCondiments from "../../data/foods/sia-karnataka-condiments.json" with { type: "json" };
import siaKarnatakaMeals from "../../data/foods/sia-karnataka-meals.json" with { type: "json" };
import siaKarnatakaNonveg from "../../data/foods/sia-karnataka-nonveg.json" with { type: "json" };
import siaKarnatakaPalya from "../../data/foods/sia-karnataka-palya.json" with { type: "json" };
import siaKarnatakaSnacks from "../../data/foods/sia-karnataka-snacks.json" with { type: "json" };
import siaKarnatakaSweets from "../../data/foods/sia-karnataka-sweets.json" with { type: "json" };
import siaKarnatakaTiffin from "../../data/foods/sia-karnataka-tiffin.json" with { type: "json" };
import siaMangalorean from "../../data/foods/sia-mangalorean.json" with { type: "json" };
import sibChettinad from "../../data/foods/sib-chettinad.json" with { type: "json" };
import sibIngredients from "../../data/foods/sib-ingredients.json" with { type: "json" };
import sibKeralaCombos from "../../data/foods/sib-kerala-combos.json" with { type: "json" };
import sibKeralaNonveg from "../../data/foods/sib-kerala-nonveg.json" with { type: "json" };
import sibKeralaSnacks from "../../data/foods/sib-kerala-snacks.json" with { type: "json" };
import sibKeralaSweets from "../../data/foods/sib-kerala-sweets.json" with { type: "json" };
import sibKeralaVeg from "../../data/foods/sib-kerala-veg.json" with { type: "json" };
import sibSouthGeneral from "../../data/foods/sib-south-general.json" with { type: "json" };
import sibTamilNonveg from "../../data/foods/sib-tamil-nonveg.json" with { type: "json" };
import sibTamilSnacks from "../../data/foods/sib-tamil-snacks.json" with { type: "json" };
import sibTamilSweets from "../../data/foods/sib-tamil-sweets.json" with { type: "json" };
import sibTamilTiffin from "../../data/foods/sib-tamil-tiffin.json" with { type: "json" };
import sibTamilVeg from "../../data/foods/sib-tamil-veg.json" with { type: "json" };
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
import wesGoanKonkan from "../../data/foods/wes-goan-konkan.json" with { type: "json" };
import wesGujFarsan from "../../data/foods/wes-guj-farsan.json" with { type: "json" };
import wesGujMeals from "../../data/foods/wes-guj-meals.json" with { type: "json" };
import wesGujSweets from "../../data/foods/wes-guj-sweets.json" with { type: "json" };
import wesMhNonveg from "../../data/foods/wes-mh-nonveg.json" with { type: "json" };
import wesMhSnacks from "../../data/foods/wes-mh-snacks.json" with { type: "json" };
import wesMhSweets from "../../data/foods/wes-mh-sweets.json" with { type: "json" };
import wesMhVeg from "../../data/foods/wes-mh-veg.json" with { type: "json" };
import composite from "../../data/foods/composite.json" with { type: "json" };

export const DATA_FILES: DataFile[] = [
  { name: "alcoholic-beverages", data: alcoholicBeverages as DataFile["data"] },
  { name: "bakery", data: bakery as DataFile["data"] },
  { name: "bakery-breads-cakes", data: bakeryBreadsCakes as DataFile["data"] },
  { name: "bas-dairy-milk-cheese", data: basDairyMilkCheese as DataFile["data"] },
  { name: "bas-dairy-raita-egg", data: basDairyRaitaEgg as DataFile["data"] },
  { name: "bas-fruits-forms", data: basFruitsForms as DataFile["data"] },
  { name: "bas-fruits-fresh", data: basFruitsFresh as DataFile["data"] },
  { name: "bas-protein-fish-plant", data: basProteinFishPlant as DataFile["data"] },
  { name: "bas-protein-meat", data: basProteinMeat as DataFile["data"] },
  { name: "bas-staples-grains", data: basStaplesGrains as DataFile["data"] },
  { name: "bas-staples-pulses", data: basStaplesPulses as DataFile["data"] },
  { name: "bas-veg-cooked", data: basVegCooked as DataFile["data"] },
  { name: "bas-veg-raw", data: basVegRaw as DataFile["data"] },
  { name: "bengali", data: bengali as DataFile["data"] },
  { name: "bengali-odia", data: bengaliOdia as DataFile["data"] },
  { name: "bihari-jharkhand", data: bihariJharkhand as DataFile["data"] },
  { name: "bihari-more", data: bihariMore as DataFile["data"] },
  { name: "biryani", data: biryani as DataFile["data"] },
  { name: "biscuits-cookies", data: biscuitsCookies as DataFile["data"] },
  { name: "branded-foods", data: brandedFoods as DataFile["data"] },
  { name: "breakfast", data: breakfast as DataFile["data"] },
  { name: "breakfast-combos", data: breakfastCombos as DataFile["data"] },
  { name: "cafe-foods", data: cafeFoods as DataFile["data"] },
  { name: "chaat", data: chaat as DataFile["data"] },
  { name: "chhattisgarhi", data: chhattisgarhi as DataFile["data"] },
  { name: "chicken", data: chicken as DataFile["data"] },
  { name: "chinese", data: chinese as DataFile["data"] },
  { name: "chinese-indo-chinese-more", data: chineseIndoChineseMore as DataFile["data"] },
  { name: "chn-burgerking", data: chnBurgerking as DataFile["data"] },
  { name: "chn-dominos", data: chnDominos as DataFile["data"] },
  { name: "chn-mcdonalds", data: chnMcdonalds as DataFile["data"] },
  { name: "chn-starbucks", data: chnStarbucks as DataFile["data"] },
  { name: "chn-subway", data: chnSubway as DataFile["data"] },
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
  { name: "dsh-bakery-breads-buns-puffs", data: dshBakeryBreadsBunsPuffs as DataFile["data"] },
  { name: "dsh-base-ingredients", data: dshBaseIngredients as DataFile["data"] },
  { name: "dsh-breakfast-poha-egg-toast-bowls", data: dshBreakfastPohaEggToastBowls as DataFile["data"] },
  { name: "dsh-cakes-celebration", data: dshCakesCelebration as DataFile["data"] },
  { name: "dsh-cakes-loaf-eggless-bakes", data: dshCakesLoafEgglessBakes as DataFile["data"] },
  { name: "dsh-desserts-puddings-ice-cream", data: dshDessertsPuddingsIceCream as DataFile["data"] },
  { name: "dsh-drinks-alcohol", data: dshDrinksAlcohol as DataFile["data"] },
  { name: "dsh-drinks-cold-cafe-mocktails", data: dshDrinksColdCafeMocktails as DataFile["data"] },
  { name: "dsh-drinks-hot-tea-coffee", data: dshDrinksHotTeaCoffee as DataFile["data"] },
  { name: "dsh-drinks-shakes-smoothies-lassi", data: dshDrinksShakesSmoothiesLassi as DataFile["data"] },
  { name: "dsh-drinks-traditional-health-juices", data: dshDrinksTraditionalHealthJuices as DataFile["data"] },
  { name: "dsh-healthy-diet-meals", data: dshHealthyDietMeals as DataFile["data"] },
  { name: "dsh-snacks-pakora-samosa-healthy", data: dshSnacksPakoraSamosaHealthy as DataFile["data"] },
  { name: "dsh-snacks-sandwiches-rolls-tikki", data: dshSnacksSandwichesRollsTikki as DataFile["data"] },
  { name: "eas-assamese", data: easAssamese as DataFile["data"] },
  { name: "eas-bengali-fish", data: easBengaliFish as DataFile["data"] },
  { name: "eas-bengali-meat-rice", data: easBengaliMeatRice as DataFile["data"] },
  { name: "eas-bengali-street-snacks", data: easBengaliStreetSnacks as DataFile["data"] },
  { name: "eas-bengali-sweets", data: easBengaliSweets as DataFile["data"] },
  { name: "eas-bengali-veg-dal", data: easBengaliVegDal as DataFile["data"] },
  { name: "eas-ingredients", data: easIngredients as DataFile["data"] },
  { name: "eas-ne-manipur-naga-mizo", data: easNeManipurNagaMizo as DataFile["data"] },
  { name: "eas-ne-meghalaya-arunachal-tripura", data: easNeMeghalayaArunachalTripura as DataFile["data"] },
  { name: "eas-odia", data: easOdia as DataFile["data"] },
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
  { name: "glo-american-breakfast", data: gloAmericanBreakfast as DataFile["data"] },
  { name: "glo-american-desserts", data: gloAmericanDesserts as DataFile["data"] },
  { name: "glo-american-fastfood", data: gloAmericanFastfood as DataFile["data"] },
  { name: "glo-american-mains", data: gloAmericanMains as DataFile["data"] },
  { name: "glo-british", data: gloBritish as DataFile["data"] },
  { name: "glo-german-french", data: gloGermanFrench as DataFile["data"] },
  { name: "glo-italian-desserts", data: gloItalianDesserts as DataFile["data"] },
  { name: "glo-italian-mains", data: gloItalianMains as DataFile["data"] },
  { name: "glo-italian-starters", data: gloItalianStarters as DataFile["data"] },
  { name: "glo-mexican", data: gloMexican as DataFile["data"] },
  { name: "glo-pantry", data: gloPantry as DataFile["data"] },
  { name: "glo-pasta-pizza", data: gloPastaPizza as DataFile["data"] },
  { name: "glo-spanish-greek", data: gloSpanishGreek as DataFile["data"] },
  { name: "glo-turkish-easteuro", data: gloTurkishEasteuro as DataFile["data"] },
  { name: "global-continental", data: globalContinental as DataFile["data"] },
  { name: "grains-cereals", data: grainsCereals as DataFile["data"] },
  { name: "gujarati", data: gujarati as DataFile["data"] },
  { name: "gujarati-rajasthani-maharashtrian", data: gujaratiRajasthaniMaharashtrian as DataFile["data"] },
  { name: "gym-foods", data: gymFoods as DataFile["data"] },
  { name: "haryanvi", data: haryanvi as DataFile["data"] },
  { name: "himalayan-kashmiri", data: himalayanKashmiri as DataFile["data"] },
  { name: "hindi-belt", data: hindiBelt as DataFile["data"] },
  { name: "ice-cream-desserts", data: iceCreamDesserts as DataFile["data"] },
  { name: "indian-breads", data: indianBreads as DataFile["data"] },
  { name: "indian-main-course", data: indianMainCourse as DataFile["data"] },
  { name: "indian-snacks", data: indianSnacks as DataFile["data"] },
  { name: "indian-thali", data: indianThali as DataFile["data"] },
  { name: "ins-noodles", data: insNoodles as DataFile["data"] },
  { name: "ins-soups", data: insSoups as DataFile["data"] },
  { name: "instant-foods", data: instantFoods as DataFile["data"] },
  { name: "jharkhandi-breads-pitha", data: jharkhandiBreadsPitha as DataFile["data"] },
  { name: "jharkhandi-drinks", data: jharkhandiDrinks as DataFile["data"] },
  { name: "jharkhandi-nonveg", data: jharkhandiNonveg as DataFile["data"] },
  { name: "jharkhandi-plates-more", data: jharkhandiPlatesMore as DataFile["data"] },
  { name: "jharkhandi-saag-more", data: jharkhandiSaagMore as DataFile["data"] },
  { name: "jharkhandi-saag-veg", data: jharkhandiSaagVeg as DataFile["data"] },
  { name: "jharkhandi-sweets-festival", data: jharkhandiSweetsFestival as DataFile["data"] },
  { name: "jharkhandi-wild-foods", data: jharkhandiWildFoods as DataFile["data"] },
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
  { name: "pantry-dried-wadi", data: pantryDriedWadi as DataFile["data"] },
  { name: "pickles", data: pickles as DataFile["data"] },
  { name: "pkd-softdrinks-juices", data: pkdSoftdrinksJuices as DataFile["data"] },
  { name: "pkg-biscuits-parle-britannia", data: pkgBiscuitsParleBritannia as DataFile["data"] },
  { name: "pkg-biscuits-sunfeast-others", data: pkgBiscuitsSunfeastOthers as DataFile["data"] },
  { name: "pkg-chips-lays-kurkure", data: pkgChipsLaysKurkure as DataFile["data"] },
  { name: "pkx-dairy-amul", data: pkxDairyAmul as DataFile["data"] },
  { name: "pkx-dairy-brands", data: pkxDairyBrands as DataFile["data"] },
  { name: "pkx-icecream-amul", data: pkxIcecreamAmul as DataFile["data"] },
  { name: "pkx-icecream-havmor-vadilal", data: pkxIcecreamHavmorVadilal as DataFile["data"] },
  { name: "pkx-icecream-kwalitywalls", data: pkxIcecreamKwalitywalls as DataFile["data"] },
  { name: "pkx-icecream-parlours", data: pkxIcecreamParlours as DataFile["data"] },
  { name: "pkx-softdrinks-cocacola", data: pkxSoftdrinksCocacola as DataFile["data"] },
  { name: "protein", data: protein as DataFile["data"] },
  { name: "pulses-beans-raw", data: pulsesBeansRaw as DataFile["data"] },
  { name: "rajasthani", data: rajasthani as DataFile["data"] },
  { name: "raw-ingredients", data: rawIngredients as DataFile["data"] },
  { name: "regional-south", data: regionalSouth as DataFile["data"] },
  { name: "rice-dishes", data: riceDishes as DataFile["data"] },
  { name: "salads", data: salads as DataFile["data"] },
  { name: "sauces-dips", data: saucesDips as DataFile["data"] },
  { name: "shakes-smoothies", data: shakesSmoothies as DataFile["data"] },
  { name: "sia-andhra-condiments", data: siaAndhraCondiments as DataFile["data"] },
  { name: "sia-andhra-curries", data: siaAndhraCurries as DataFile["data"] },
  { name: "sia-andhra-nonveg", data: siaAndhraNonveg as DataFile["data"] },
  { name: "sia-andhra-snacks-sweets", data: siaAndhraSnacksSweets as DataFile["data"] },
  { name: "sia-andhra-tiffin", data: siaAndhraTiffin as DataFile["data"] },
  { name: "sia-hyderabadi-main", data: siaHyderabadiMain as DataFile["data"] },
  { name: "sia-hyderabadi-snacks-sweets", data: siaHyderabadiSnacksSweets as DataFile["data"] },
  { name: "sia-karnataka-condiments", data: siaKarnatakaCondiments as DataFile["data"] },
  { name: "sia-karnataka-meals", data: siaKarnatakaMeals as DataFile["data"] },
  { name: "sia-karnataka-nonveg", data: siaKarnatakaNonveg as DataFile["data"] },
  { name: "sia-karnataka-palya", data: siaKarnatakaPalya as DataFile["data"] },
  { name: "sia-karnataka-snacks", data: siaKarnatakaSnacks as DataFile["data"] },
  { name: "sia-karnataka-sweets", data: siaKarnatakaSweets as DataFile["data"] },
  { name: "sia-karnataka-tiffin", data: siaKarnatakaTiffin as DataFile["data"] },
  { name: "sia-mangalorean", data: siaMangalorean as DataFile["data"] },
  { name: "sib-chettinad", data: sibChettinad as DataFile["data"] },
  { name: "sib-ingredients", data: sibIngredients as DataFile["data"] },
  { name: "sib-kerala-combos", data: sibKeralaCombos as DataFile["data"] },
  { name: "sib-kerala-nonveg", data: sibKeralaNonveg as DataFile["data"] },
  { name: "sib-kerala-snacks", data: sibKeralaSnacks as DataFile["data"] },
  { name: "sib-kerala-sweets", data: sibKeralaSweets as DataFile["data"] },
  { name: "sib-kerala-veg", data: sibKeralaVeg as DataFile["data"] },
  { name: "sib-south-general", data: sibSouthGeneral as DataFile["data"] },
  { name: "sib-tamil-nonveg", data: sibTamilNonveg as DataFile["data"] },
  { name: "sib-tamil-snacks", data: sibTamilSnacks as DataFile["data"] },
  { name: "sib-tamil-sweets", data: sibTamilSweets as DataFile["data"] },
  { name: "sib-tamil-tiffin", data: sibTamilTiffin as DataFile["data"] },
  { name: "sib-tamil-veg", data: sibTamilVeg as DataFile["data"] },
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
  { name: "wes-goan-konkan", data: wesGoanKonkan as DataFile["data"] },
  { name: "wes-guj-farsan", data: wesGujFarsan as DataFile["data"] },
  { name: "wes-guj-meals", data: wesGujMeals as DataFile["data"] },
  { name: "wes-guj-sweets", data: wesGujSweets as DataFile["data"] },
  { name: "wes-mh-nonveg", data: wesMhNonveg as DataFile["data"] },
  { name: "wes-mh-snacks", data: wesMhSnacks as DataFile["data"] },
  { name: "wes-mh-sweets", data: wesMhSweets as DataFile["data"] },
  { name: "wes-mh-veg", data: wesMhVeg as DataFile["data"] },
  { name: "composite", data: composite as DataFile["data"] },
];
