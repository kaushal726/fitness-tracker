import { cx } from "../../lib/cx.ts";
import { Button } from "../../ui/Button";
import { CountUp } from "../../ui/CountUp";
import { IconChevronDown } from "../../ui/icons";
import styles from "./CartBar.module.css";

/** Shorter than the count on the Today screen: foods are added one after another, and the total should keep up. */
const COUNT_MS = 380;

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
          <span className={cx(styles.title, "num")}>
            <span key={count} className="motion-bump">{count} {count === 1 ? "item" : "items"}</span> · <CountUp value={kcal} duration={COUNT_MS} /> kcal
          </span>
          <span className={styles.hint}>{reviewing ? "Add more foods" : "Review or edit"}</span>
        </span>
        <IconChevronDown className={cx(styles.chevron, !reviewing && styles.up)} aria-hidden />
      </button>
      <Button variant="primary" size="lg" onClick={onDone}>Done</Button>
    </div>
  );
}
