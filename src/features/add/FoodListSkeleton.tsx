import styles from "./FoodListSkeleton.module.css";
import listStyles from "./FoodList.module.css";

/** Placeholder rows shaped like a food list, shown for the moment the foods are still arriving. */
export function FoodListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className={listStyles.list} aria-busy="true" aria-label="Loading foods">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={`${listStyles.row} ${styles.row}`}>
          <span className={styles.tile} />
          <span className={styles.lines}>
            <span className={styles.name} />
            <span className={styles.meta} />
          </span>
        </li>
      ))}
    </ul>
  );
}
