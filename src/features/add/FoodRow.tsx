import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  favorite?: boolean;
  /** Opens the amount sheet. Nothing is logged until the person has said how much. */
  onSelect: (food: Food) => void;
}

/** "Boiled Egg — 1 × Egg · 78 kcal": enough to pick the right one. The whole row, plus included, asks for the amount. */
export function FoodRow({ food, favorite, onSelect }: Props) {
  const serving = food.servingOptions[0];
  return (
    <li className={styles.row}>
      <button type="button" className={styles.main} onClick={() => onSelect(food)}>
        <FoodTile category={food.category} />
        <span className={styles.text}>
          <span className={styles.name}>
            <span className={styles.nameText}>{food.name}</span>
            {favorite && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          {serving && <span className={styles.meta}>{formatPortionText(serving.label)} · {formatNumber(food.nutritionPerServing.calories)} kcal</span>}
        </span>
        <span className={styles.add} aria-hidden><IconPlus /></span>
      </button>
    </li>
  );
}

export function FoodList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
