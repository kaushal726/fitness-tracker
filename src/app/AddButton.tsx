import { cx } from "../lib/cx";
import { IconPlus } from "../ui/icons";
import styles from "./AddButton.module.css";

/** Phones: the one thing done most, floating at the bottom right above the bar, whichever tab is open. */
export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={cx(styles.fab, "mobile-only")} onClick={onClick} aria-label="Add food">
      <IconPlus aria-hidden />
      Add
    </button>
  );
}
