import { APP_NAME } from "../../app/brand";
import { BrandMark } from "../../ui/BrandMark";
import { MadeWithLove } from "../../ui/MadeWithLove";
import styles from "./wizard.module.css";

/** The brand-coloured side of the setup on wide screens. Phones never show it. */
export function BrandPanel() {
  return (
    <aside className={styles.panel} aria-hidden>
      <span className={styles.ringLarge} />
      <span className={styles.ringSmall} />
      <div className={styles.panelBrand}>
        <BrandMark className={styles.panelMark} />
        <p className={styles.panelName}>{APP_NAME}</p>
      </div>
      <div className={styles.panelCopy}>
        <h2>Let's build your daily plan.</h2>
        <p>A few quick questions, then you are ready to log your first meal. It takes about a minute.</p>
      </div>
      <MadeWithLove onBrand />
    </aside>
  );
}
