import type { IconType } from "react-icons";
import {
  IconBakery, IconBreakfast, IconCookie, IconDairy, IconDessert, IconDrink, IconEdit, IconFastFood, IconFruit, IconGrain, IconMeal,
  IconMeat, IconNut, IconPackage, IconSalad, IconSoup, IconSupplement, IconSweet, IconVegetable,
} from "../../ui/icons";

export type CategoryTone = "green" | "blue" | "amber" | "rose" | "slate";

interface CategoryStyle {
  icon: IconType;
  tone: CategoryTone;
}

/** How each food category looks in lists: an icon and a soft colour. Unknown categories get a plain fork and knife. */
const STYLES: Record<string, CategoryStyle> = {
  breakfast: { icon: IconBreakfast, tone: "amber" },
  main_course: { icon: IconMeal, tone: "amber" },
  snacks: { icon: IconCookie, tone: "amber" },
  fruits: { icon: IconFruit, tone: "green" },
  vegetables: { icon: IconVegetable, tone: "green" },
  dairy: { icon: IconDairy, tone: "blue" },
  protein: { icon: IconMeat, tone: "blue" },
  drinks: { icon: IconDrink, tone: "rose" },
  sweets: { icon: IconSweet, tone: "rose" },
  desserts: { icon: IconDessert, tone: "rose" },
  fast_food: { icon: IconFastFood, tone: "amber" },
  chinese: { icon: IconSoup, tone: "amber" },
  bakery: { icon: IconBakery, tone: "amber" },
  nuts_seeds: { icon: IconNut, tone: "green" },
  condiments: { icon: IconSalad, tone: "green" },
  supplements: { icon: IconSupplement, tone: "blue" },
  packaged: { icon: IconPackage, tone: "slate" },
  staples: { icon: IconGrain, tone: "amber" },
  custom: { icon: IconEdit, tone: "slate" },
};

const FALLBACK: CategoryStyle = { icon: IconMeal, tone: "slate" };

export function categoryStyle(category: string): CategoryStyle {
  return STYLES[category] ?? FALLBACK;
}
