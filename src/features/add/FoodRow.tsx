import type { LastUsed } from "../../data/types.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  favorite?: boolean;
  /** How this food was last logged. It is what the amount sheet starts from, so the row says so. */
  last?: LastUsed;
  /** Opens the amount sheet. Nothing is logged until the person has said how much. */
  onSelect: (food: Food) => void;
}

/** "Roti — 3 × Roti · 318 kcal": enough to pick the right one. The whole row, plus included, asks for the amount. */
export function FoodRow({ food, favorite, last, onSelect }: Props) {
  const serving = food.servingOptions[0];
  const lastHad = lastPortionSummary(food, last);
  const meta = lastHad
    ? `${formatPortionText(lastHad.text)} · ${formatNumber(lastHad.calories)} kcal`
    : serving && `${formatPortionText(serving.label)} · ${formatNumber(food.nutritionPerServing.calories)} kcal`;
  return (
    <li className={styles.row}>
      <button type="button" className={styles.main} onClick={() => onSelect(food)}>
        <FoodTile category={food.category} />
        <span className={styles.text}>
          <span className={styles.name}>
            <span className={styles.nameText}>{food.name}</span>
            {favorite && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        <span className={styles.add} aria-hidden><IconPlus /></span>
      </button>
    </li>
  );
}

export function FoodList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
