import type { ReactNode } from "react";
import { deleteCustomFood, useAppState } from "../../data/store.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import { CUSTOM_CATEGORY } from "../../nutrition/custom.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconButton } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { IconPlus, IconStar, IconTrash } from "../../ui/icons";
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
  const confirm = useConfirm();
  const own = food.category === CUSTOM_CATEGORY;
  const serving = food.servingOptions[0];
  const lastHad = lastPortionSummary(food, lastUsed[food.id]);
  const meta = lastHad
    ? `${formatPortionText(lastHad.text)} · ${formatNumber(lastHad.calories)} kcal`
    : serving && `${formatPortionText(serving.label)} · ${formatNumber(food.nutritionPerServing.calories)} kcal`;
  const remove = async () => {
    const ok = await confirm({ title: "Delete this food?", message: "Days you already logged with it keep their numbers.", confirmLabel: "Delete", danger: true });
    if (ok) deleteCustomFood(food.id);
  };
  return (
    <li className={cx(styles.row, own && styles.split)}>
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
      {own && <IconButton className={styles.remove} label="Delete this food" icon={<IconTrash />} variant="danger" onClick={() => void remove()} />}
    </li>
  );
}

export function FoodList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
