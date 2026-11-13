import { useId, useState, type CSSProperties } from "react";
import type { Entry } from "../../data/types.ts";
import { KCAL_PER_G } from "../../domain/goals.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatTime } from "../../lib/dates.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { MealType } from "../../nutrition/types.ts";
import { IconButton } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { IconChevronDown, IconPlus } from "../../ui/icons";
import { MealIcon, MEAL_TONE } from "../meals/MealIcon.tsx";
import styles from "./MealCard.module.css";

/** A meal's total glides to a new value (an entry added, changed or removed) instead of jumping. */
const TOTAL_COUNT_MS = 500;

const MACROS = [
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
] as const;
const PERCENT = 100;

interface Props {
  meal: MealType;
  /** Its place on the page: the cards arrive one after another. */
  index: number;
  entries: Entry[];
  /** Whether the entries are showing. A meal with nothing in it has nothing to fold. */
  open: boolean;
  onToggle: (meal: MealType) => void;
  onOpen: (entry: Entry) => void;
  onAdd: (meal: MealType) => void;
}

/**
 * One meal of the day. Folded, it is one line: the meal's picture, how many foods, and the calories eaten in it.
 * There is no target to reach: a meal only says what it has had. Open, it lists each food and the meal's protein, carbs and fat.
 */
export function MealCard({ meal, index, entries, open, onToggle, onOpen, onAdd }: Props) {
  const animates = useAnimatesIn();
  // What was here when the card appeared is not new: only food that comes after it rises into place and glows.
  const [known] = useState(() => new Set(entries.map((e) => e.id)));
  const bodyId = useId();
  const kcal = entries.reduce((sum, e) => sum + e.nutrition.calories, 0);
  const label = MEAL_LABELS[meal];
  const foldable = entries.length > 0;
  const count = `${entries.length} ${entries.length === 1 ? "item" : "items"}`;
  const grams = MACROS.map((m) => ({ ...m, grams: entries.reduce((sum, e) => sum + e.nutrition[m.key], 0) }));
  const macroKcal = grams.reduce((sum, m) => sum + m.grams * KCAL_PER_G[m.key], 0);
  // Each nutrient's share of the meal's calories, for the bar that splits them.
  const macros = grams.map((m) => ({ ...m, share: macroKcal > 0 ? (m.grams * KCAL_PER_G[m.key]) / macroKcal : 0 }));

  const summary = (
    <>
      <MealIcon meal={meal} size="md" />
      <span className={styles.headText}>
        <span className={styles.name}>{label}</span>
        <span className={styles.detail}>{foldable ? count : "Nothing logged yet"}</span>
      </span>
      {foldable && (
        <span className={styles.total}>
          <span className={cx(styles.totalValue, "num")}><CountUp value={kcal} duration={TOTAL_COUNT_MS} /><small> kcal</small></span>
        </span>
      )}
      {foldable && <span className={styles.chevron} aria-hidden><IconChevronDown /></span>}
    </>
  );

  return (
    <Card
      padded={false}
      className={cx(styles.card, styles[MEAL_TONE[meal]], !foldable && styles.empty, foldable && open && styles.isOpen, animates && "motion-rise")}
      style={{ "--i": index } as CSSProperties}
      aria-label={label}
      role="region"
    >
      <header className={styles.header}>
        <h2 className={styles.heading}>
          {foldable ? (
            <button type="button" className={cx(styles.summary, styles.toggle)} aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(meal)}>{summary}</button>
          ) : (
            <span className={styles.summary}>{summary}</span>
          )}
        </h2>
        <IconButton label={`Add to ${label}`} icon={<IconPlus />} variant="soft" className={styles.add} onClick={() => onAdd(meal)} />
      </header>

      {foldable && (
        <div id={bodyId} className={cx(styles.body, open && styles.bodyOpen)} inert={!open}>
          <div className={styles.bodyInner}>
            <ul className={styles.list}>
              {entries.map((e) => (
                <li key={e.id} className={known.has(e.id) ? undefined : "motion-arrive"}>
                  <button type="button" className={styles.entry} onClick={() => onOpen(e)}>
                    <span className={styles.dot} aria-hidden />
                    <span className={styles.entryMain}>
                      <span className={styles.entryName}>{e.name}</span>
                      <span className={styles.entryMeta}>{formatPortionText(e.portionText)} · {formatTime(e.at)}</span>
                    </span>
                    <span className={cx(styles.entryKcal, "num")}>{formatNumber(e.nutrition.calories)}<small> kcal</small></span>
                  </button>
                </li>
              ))}
            </ul>
            <footer className={styles.foot}>
              <span className={styles.split} role="img" aria-label={`Calories from ${macros.map((m) => `${m.label.toLowerCase()} ${Math.round(m.share * PERCENT)}%`).join(", ")}`}>
                {macros.map((m) => m.share > 0 && <span key={m.key} className={styles[`m_${m.key}`]} style={{ flexGrow: m.share }} />)}
              </span>
              <span className={styles.macros}>
                {macros.map((m) => (
                  <span key={m.key} className={cx(styles.macro, styles[`m_${m.key}`])}>
                    <span className={styles.macroLabel}>{m.label}</span>
                    <span className={cx(styles.macroValue, "num")}>{formatNumber(m.grams)}<small> g</small></span>
                  </span>
                ))}
              </span>
            </footer>
          </div>
        </div>
      )}
    </Card>
  );
}
