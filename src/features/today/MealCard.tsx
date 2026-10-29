import { useId, useState, type CSSProperties } from "react";
import type { IconType } from "react-icons";
import type { Entry } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatTime } from "../../lib/dates.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/Button";
import { CountUp } from "../../ui/CountUp";
import { IconBreakfast, IconChevronDown, IconDinner, IconLunch, IconPlus, IconSnack } from "../../ui/icons";
import styles from "./MealCard.module.css";

const MEAL_ICONS: Record<MealType, IconType> = { breakfast: IconBreakfast, lunch: IconLunch, snack: IconSnack, dinner: IconDinner };
const MEAL_TONES: Record<MealType, string> = { breakfast: styles.amber, lunch: styles.green, snack: styles.rose, dinner: styles.blue };

/** A meal's total glides to a new value (an entry added, changed or removed) instead of jumping. */
const TOTAL_COUNT_MS = 500;

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

/** One meal of the day: its total on a single line, and what was eaten underneath, which can be folded away. */
export function MealCard({ meal, index, entries, open, onToggle, onOpen, onAdd }: Props) {
  const Icon = MEAL_ICONS[meal];
  const animates = useAnimatesIn();
  // What was here when the card appeared is not new: only food that comes after it rises into place and glows.
  const [known] = useState(() => new Set(entries.map((e) => e.id)));
  const bodyId = useId();
  const kcal = entries.reduce((sum, e) => sum + e.nutrition.calories, 0);
  const label = MEAL_LABELS[meal];
  const foldable = entries.length > 0;
  const detail = foldable ? `${entries.length} ${entries.length === 1 ? "item" : "items"}` : "Nothing added yet";

  const summary = (
    <>
      <span className={cx(styles.tile, MEAL_TONES[meal])} aria-hidden><Icon /></span>
      <span className={styles.headText}>
        <span className={styles.name}>{label}</span>
        <span className={styles.count}>{detail}</span>
      </span>
      {foldable && <span className={cx(styles.total, "num")}><CountUp value={kcal} duration={TOTAL_COUNT_MS} /><small> kcal</small></span>}
      {foldable && <IconChevronDown className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden />}
    </>
  );

  return (
    <Card padded={false} className={cx(styles.card, animates && "motion-rise")} style={{ "--i": index } as CSSProperties} aria-label={label} role="region">
      <header className={styles.header}>
        <h2 className={styles.heading}>
          {foldable ? (
            <button type="button" className={cx(styles.summary, styles.toggle)} aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(meal)}>{summary}</button>
          ) : (
            <span className={styles.summary}>{summary}</span>
          )}
        </h2>
        <IconButton label={`Add to ${label}`} icon={<IconPlus />} variant="soft" onClick={() => onAdd(meal)} />
      </header>

      {foldable && (
        <div id={bodyId} className={cx(styles.body, open && styles.bodyOpen)} inert={!open}>
          <div className={styles.bodyInner}>
            <ul className={styles.list}>
              {entries.map((e) => (
                <li key={e.id} className={known.has(e.id) ? undefined : "motion-arrive"}>
                  <button type="button" className={styles.entry} onClick={() => onOpen(e)}>
                    <span className={styles.entryMain}>
                      <span className={styles.entryName}>{e.name}</span>
                      <span className={styles.entryMeta}>{formatPortionText(e.portionText)} · {formatTime(e.at)}</span>
                    </span>
                    <span className={cx(styles.entryKcal, "num")}>{formatNumber(e.nutrition.calories)}<small> kcal</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
