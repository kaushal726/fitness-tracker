import { cx } from "../lib/cx";
import { BrandMark } from "../ui/BrandMark";
import { MadeWithLove } from "../ui/MadeWithLove";
import { APP_NAME } from "./brand";
import styles from "./Splash.module.css";

/** The opening moment: the mark pops in, the plus draws itself, the name rises. Purely decorative. */
export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div className={cx(styles.splash, leaving && styles.leaving)} aria-hidden>
      <div className={styles.center}>
        <BrandMark className={styles.mark} plusClassName={styles.plus} />
        <p className={styles.name}>{APP_NAME}</p>
      </div>
      <div className={styles.credit}>
        <MadeWithLove onBrand />
      </div>
    </div>
  );
}
