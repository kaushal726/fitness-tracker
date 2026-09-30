import { useEffect, useRef, type ReactNode } from "react";
import type { LastUsed } from "../../data/types.ts";
import { lastPortionSummary } from "../../domain/portions.ts";
import { cx } from "../../lib/cx.ts";
import { prefersReducedMotion } from "../../lib/device.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconCheck, IconPlus, IconStar } from "../../ui/icons";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./FoodList.module.css";

interface Props {
  food: Food;
  favorite?: boolean;
  /** How this food was last logged. It is what the amount card starts from, so the row says so. */
  last?: LastUsed;
  /** Logged during this visit. */
  added?: boolean;
  expanded: boolean;
  onToggle: (food: Food) => void;
  /** What opens under the row: the amount card. */
  children?: ReactNode;
}

/** "Roti — 3 × Roti · 318 kcal": enough to pick the right one. Tapping the row opens the amount card right under it. */
export function FoodRow({ food, favorite, last, added, expanded, onToggle, children }: Props) {
  const ref = useRef<HTMLLIElement>(null);
  const serving = food.servingOptions[0];
  const lastHad = lastPortionSummary(food, last);
  const meta = lastHad
    ? `${formatPortionText(lastHad.text)} · ${formatNumber(lastHad.calories)} kcal`
    : serving && `${formatPortionText(serving.label)} · ${formatNumber(food.nutritionPerServing.calories)} kcal`;

  // A card that opens below the fold brings itself into view.
  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [expanded]);

  const showCheck = added && !expanded;
  return (
    <li ref={ref} className={cx(styles.row, expanded && styles.open)}>
      <button type="button" className={styles.main} aria-expanded={expanded} onClick={() => onToggle(food)}>
        <FoodTile category={food.category} />
        <span className={styles.text}>
          <span className={styles.name}>
            <span className={styles.nameText}>{food.name}</span>
            {favorite && <IconStar className={styles.star} aria-label="Favourite" />}
          </span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        <span className={cx(styles.add, showCheck && styles.added)} aria-hidden>{showCheck ? <IconCheck /> : <IconPlus />}</span>
      </button>
      {expanded && <div className={styles.panel}>{children}</div>}
    </li>
  );
}

export function FoodList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
