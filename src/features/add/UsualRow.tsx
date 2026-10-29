import { useState, type CSSProperties } from "react";
import { useAppState } from "../../data/store.ts";
import type { LastUsed } from "../../data/types.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconCheck, IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import { ReasonChip } from "./ReasonChip.tsx";
import type { Reason } from "./suggestions.ts";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  /** The amount that is usual for the meal: what one tap adds. */
  portion: LastUsed;
  /** Already added on this visit. */
  added: boolean;
  /** Why it is offered, when that is more than "you usually have it". */
  reason?: Reason;
  /** Its place in the list: the rows arrive one after another. */
  index?: number;
  /** Opens the amount page, on this amount, to change it. */
  onSelect: (food: Food, portion: LastUsed) => void;
  onQuickAdd: (food: Food, portion: LastUsed) => void;
}

/** "Masala dosa — 1 dosa · 330 kcal": the text opens the amount; the round button adds exactly what the row says. */
export function UsualRow({ food, portion, added, reason, index = 0, onSelect, onQuickAdd }: Props) {
  const { favorites } = useAppState();
  const animates = useAnimatesIn();
  /** Set by a tap on this row's button: the tick and the glow play for that add, not for a food that was already added. */
  const [justAdded, setJustAdded] = useState(false);
  const summary = lastPortionSummary(food, portion);
  if (!summary) return null;
  const meta = `${formatPortionText(summary.text)} · ${formatNumber(summary.calories)} kcal`;
  const label = added ? `${food.name} added` : `Add ${food.name}, ${meta}`;
  const add = () => {
    setJustAdded(true);
    onQuickAdd(food, portion);
  };
  const playing = added && justAdded;
  return (
    <li className={cx(styles.row, styles.split, animates && "motion-rise", added && styles.done, playing && "motion-glow")} style={{ "--i": Math.min(index, 8) } as CSSProperties}>
      <button type="button" className={styles.main} onClick={() => onSelect(food, portion)}>
        <FoodTile category={food.category} />
        <span className={styles.text}>
          <span className={styles.name}>
            <span className={styles.nameText}>{food.name}</span>
            {favorites.includes(food.id) && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          <span className={styles.meta}>{meta}</span>
          {reason && <ReasonChip reason={reason} />}
        </span>
      </button>
      <button type="button" className={cx(styles.quick, added && styles.added, playing && "motion-pop motion-ripple motion-check")} aria-label={label} title={label} disabled={added} onClick={add}>
        {added ? <IconCheck /> : <IconPlus />}
      </button>
    </li>
  );
}
