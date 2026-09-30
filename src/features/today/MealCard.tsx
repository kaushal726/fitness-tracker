import type { IconType } from "react-icons";
import type { Entry } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import { formatTime } from "../../lib/dates.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/Button";
import { IconBreakfast, IconDinner, IconLunch, IconPlus, IconSnack } from "../../ui/icons";
import styles from "./MealCard.module.css";

const MEAL_ICONS: Record<MealType, IconType> = { breakfast: IconBreakfast, lunch: IconLunch, snack: IconSnack, dinner: IconDinner };
const MEAL_TONES: Record<MealType, string> = { breakfast: styles.amber, lunch: styles.green, snack: styles.rose, dinner: styles.blue };

interface Props {
  meal: MealType;
  entries: Entry[];
  onOpen: (entry: Entry) => void;
  onAdd: (meal: MealType) => void;
}

export function MealCard({ meal, entries, onOpen, onAdd }: Props) {
  const Icon = MEAL_ICONS[meal];
  const kcal = entries.reduce((sum, e) => sum + e.nutrition.calories, 0);
  const label = MEAL_LABELS[meal];

  return (
    <Card padded={false} className={styles.card} aria-label={label} role="region">
      <header className={styles.header}>
        <span className={cx(styles.tile, MEAL_TONES[meal])} aria-hidden><Icon /></span>
        <div className={styles.headText}>
          <h2 className={styles.name}>{label}</h2>
          <p className={styles.count}>{entries.length ? `${entries.length} ${entries.length === 1 ? "item" : "items"}` : "Nothing added yet"}</p>
        </div>
        {entries.length > 0 && <span className={cx(styles.total, "num")}>{formatNumber(kcal)}<small> kcal</small></span>}
        <IconButton label={`Add to ${label}`} icon={<IconPlus />} variant="soft" onClick={() => onAdd(meal)} />
      </header>

      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((e) => (
            <li key={e.id}>
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
      )}
    </Card>
  );
}
