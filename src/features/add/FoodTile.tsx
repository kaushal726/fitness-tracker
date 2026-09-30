import { cx } from "../../lib/cx.ts";
import { categoryStyle } from "./categoryStyle.ts";
import styles from "./FoodTile.module.css";

/** The small coloured icon that stands for a food's category. */
export function FoodTile({ category, size = 44 }: { category: string; size?: number }) {
  const { icon: Icon, tone } = categoryStyle(category);
  return (
    <span className={cx(styles.tile, styles[tone])} style={{ width: size, height: size, fontSize: size * 0.48 }} aria-hidden>
      <Icon />
    </span>
  );
}
