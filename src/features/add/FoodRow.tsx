import type { ReactNode } from "react";
import { useAppState } from "../../data/store.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  /** Opens the amount page. Nothing is logged until the person has said how much. */
  onSelect: (food: Food) => void;
}

/** "Roti — 3 × Roti · 318 kcal": enough to pick the right one. The whole row, plus included, asks for the amount. */
export function FoodRow({ food, onSelect }: Props) {
  const { favorites, lastUsed } = useAppState();
  const serving = food.servingOptions[0];
  const lastHad = lastPortionSummary(food, lastUsed[food.id]);
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
            {favorites.includes(food.id) && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        <span className={styles.add} aria-hidden><IconPlus /></span>
      </button>
    </li>
  );
}

export function FoodList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
