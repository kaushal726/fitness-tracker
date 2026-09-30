import { useId, useState } from "react";
import type { Entry } from "../../data/types.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconChevronDown, IconTrash } from "../../ui/icons";
import styles from "./AddedCart.module.css";

interface Props {
  /** What has been added since the sheet opened, in the order it was added. */
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onRemove: (entry: Entry) => void;
  onDone: () => void;
}

/**
 * The foot of the add sheet once something is in it: the total so far, a list of everything added that opens
 * from that total (tap an item to change its amount, or take it out), and Done. Nothing has to wait for Done
 * to be put right.
 */
export function AddedCart({ entries, onEdit, onRemove, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const kcal = entries.reduce((sum, e) => sum + e.nutrition.calories, 0);

  return (
    <div className={styles.cart}>
      <div className={cx(styles.drawer, open && styles.drawerOpen)} inert={!open}>
        <div className={styles.drawerInner}>
          <ul id={listId} className={styles.list} aria-label="Added so far">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className={styles.row}>
                <button type="button" className={styles.edit} onClick={() => onEdit(e)}>
                  <span className={styles.main}>
                    <span className={styles.name}>{e.name}</span>
                    <span className={styles.meta}>{formatPortionText(e.portionText)} · {MEAL_LABELS[e.meal]}</span>
                  </span>
                  <span className={cx(styles.kcal, "num")}>{formatNumber(e.nutrition.calories)}<small> kcal</small></span>
                </button>
                <IconButton label={`Remove ${e.name}`} icon={<IconTrash />} onClick={() => onRemove(e)} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bar}>
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
          <span className={styles.text}>
            <span className={styles.title}>{entries.length} {entries.length === 1 ? "item" : "items"} · {formatNumber(kcal)} kcal</span>
            <span className={styles.hint}>{open ? "Hide the list" : "Review or edit"}</span>
          </span>
          <IconChevronDown className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden />
        </button>
        <Button variant="primary" size="lg" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
