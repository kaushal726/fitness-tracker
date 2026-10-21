import { useAppState } from "../../data/store.ts";
import type { LastUsed } from "../../data/types.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconCheck, IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  /** The amount that is usual for the meal: what one tap adds. */
  portion: LastUsed;
  /** Already added on this visit. */
  added: boolean;
  /** Opens the amount page, on this amount, to change it. */
  onSelect: (food: Food, portion: LastUsed) => void;
  onQuickAdd: (food: Food, portion: LastUsed) => void;
}

/** "Masala dosa — 1 dosa · 330 kcal": the text opens the amount; the round button adds exactly what the row says. */
export function UsualRow({ food, portion, added, onSelect, onQuickAdd }: Props) {
  const { favorites } = useAppState();
  const summary = lastPortionSummary(food, portion);
  if (!summary) return null;
  const meta = `${formatPortionText(summary.text)} · ${formatNumber(summary.calories)} kcal`;
  const label = added ? `${food.name} added` : `Add ${food.name}, ${meta}`;
  return (
    <li className={cx(styles.row, styles.split)}>
      <button type="button" className={styles.main} onClick={() => onSelect(food, portion)}>
        <FoodTile category={food.category} />
        <span className={styles.text}>
          <span className={styles.name}>
            <span className={styles.nameText}>{food.name}</span>
            {favorites.includes(food.id) && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          <span className={styles.meta}>{meta}</span>
        </span>
      </button>
      <button type="button" className={cx(styles.quick, added && styles.added)} aria-label={label} title={label} disabled={added} onClick={() => onQuickAdd(food, portion)}>
        {added ? <IconCheck /> : <IconPlus />}
      </button>
    </li>
  );
}
