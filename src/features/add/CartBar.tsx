import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { Button } from "../../ui/Button";
import { IconChevronDown } from "../../ui/icons";
import styles from "./CartBar.module.css";

interface Props {
  count: number;
  kcal: number;
  /** The list of what was added is showing. */
  reviewing: boolean;
  onToggleReview: () => void;
  onDone: () => void;
}

/** The foot of the add page once something is added: the total so far, a way to look over or fix it, and Done. */
export function CartBar({ count, kcal, reviewing, onToggleReview, onDone }: Props) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.toggle} aria-pressed={reviewing} onClick={onToggleReview}>
        <span className={styles.text}>
          <span className={cx(styles.title, "num")}>{count} {count === 1 ? "item" : "items"} · {formatNumber(kcal)} kcal</span>
          <span className={styles.hint}>{reviewing ? "Add more foods" : "Review or edit"}</span>
        </span>
        <IconChevronDown className={cx(styles.chevron, !reviewing && styles.up)} aria-hidden />
      </button>
      <Button variant="primary" size="lg" onClick={onDone}>Done</Button>
    </div>
  );
}
