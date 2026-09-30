import { APP_CREDIT } from "../app/brand";
import { cx } from "../lib/cx";
import { IconHeart } from "./icons";
import styles from "./MadeWithLove.module.css";

interface MadeWithLoveProps {
  /** For use on the brand-coloured opening screen, where the text is light. */
  onBrand?: boolean;
}

/** The maker's signature: a small heart and one line. */
export function MadeWithLove({ onBrand }: MadeWithLoveProps) {
  return (
    <p className={cx(styles.credit, onBrand && styles.onBrand)}>
      <IconHeart className={styles.heart} aria-hidden />
      {APP_CREDIT}
    </p>
  );
}
