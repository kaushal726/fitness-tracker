import type { IconType } from "react-icons";
import { cx } from "../../lib/cx.ts";
import type { MealType } from "../../nutrition/types.ts";
import { IconBreakfast, IconDinner, IconLunch, IconSnack } from "../../ui/icons";
import styles from "./MealIcon.module.css";

const MEAL_ICONS: Record<MealType, IconType> = { breakfast: IconBreakfast, lunch: IconLunch, snack: IconSnack, dinner: IconDinner };

/** The colour each meal wears, borrowed from the nutrient colours so it follows the theme. */
export const MEAL_TONE: Record<MealType, "carbs" | "fiber" | "fat" | "protein"> = { breakfast: "carbs", lunch: "fiber", snack: "fat", dinner: "protein" };

interface Props {
  meal: MealType;
  size?: "sm" | "md";
  className?: string;
}

/** A meal's picture on a soft square of its own colour. */
export function MealIcon({ meal, size = "md", className }: Props) {
  const Icon = MEAL_ICONS[meal];
  return (
    <span className={cx(styles.tile, styles[MEAL_TONE[meal]], styles[size], className)} aria-hidden>
      <Icon />
    </span>
  );
}
