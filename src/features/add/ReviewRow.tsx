import type { Entry } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import { IconButton } from "../../ui/Button";
import { IconChevronRight, IconTrash } from "../../ui/icons";
import listStyles from "./FoodList.module.css";
import styles from "./ReviewRow.module.css";

interface Props {
  entry: Entry;
  /** False when the food is gone (a custom food that was deleted): the entry can still be taken out, not changed. */
  editable: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/** One thing that was added: what, how much, and which meal. Tap it to change the amount. */
export function ReviewRow({ entry, editable, onEdit, onRemove }: Props) {
  const content = (
    <>
      <span className={listStyles.text}>
        <span className={listStyles.name}><span className={listStyles.nameText}>{entry.name}</span></span>
        <span className={listStyles.meta}>{editable ? `${formatPortionText(entry.portionText)} · ${MEAL_LABELS[entry.meal]}` : "No longer in your list"}</span>
      </span>
      <span className={cx(styles.kcal, "num")}>{formatNumber(entry.nutrition.calories)}<small> kcal</small></span>
    </>
  );

  return (
    <li className={listStyles.row}>
      {editable ? (
        <button type="button" className={listStyles.main} onClick={onEdit}>
          {content}
          <IconChevronRight className={styles.chevron} aria-hidden />
        </button>
      ) : (
        <div className={listStyles.main}>
          {content}
          <IconButton label={`Remove ${entry.name}`} icon={<IconTrash />} onClick={onRemove} />
        </div>
      )}
    </li>
  );
}
