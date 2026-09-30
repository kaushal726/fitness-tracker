import { useEffect, useRef, useState } from "react";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconButton } from "../../ui/Button";
import { IconCheck, IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  favorite?: boolean;
  onSelect: (food: Food) => void;
  /** Adds one usual serving straight away, no questions asked. */
  onQuickAdd: (food: Food) => void;
}

const TICK_MS = 1400;

/** "Boiled Egg — 1 × Egg · 78 kcal": enough to pick the right one without opening it. */
export function FoodRow({ food, favorite, onSelect, onQuickAdd }: Props) {
  const serving = food.servingOptions[0];
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const quickAdd = () => {
    onQuickAdd(food);
    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), TICK_MS);
  };

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
      </button>
      <IconButton
        label={justAdded ? `Added ${food.name}` : `Add one serving of ${food.name}`}
        icon={justAdded ? <IconCheck /> : <IconPlus />}
        variant={justAdded ? "primary" : "soft"}
        onClick={quickAdd}
      />
    </li>
  );
}

export function FoodList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
