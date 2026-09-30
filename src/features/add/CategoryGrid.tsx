import { getFoodsByCategory } from "../../nutrition/index.ts";
import { categoryIds, categoryLabel } from "../../nutrition/categories.ts";
import { FoodTile } from "./FoodTile.tsx";
import styles from "./CategoryGrid.module.css";

interface Props {
  onPick: (category: string) => void;
}

/** Browse without typing: every category, with how many foods it holds. */
export function CategoryGrid({ onPick }: Props) {
  return (
    <ul className={styles.grid}>
      {categoryIds().map((id) => (
        <li key={id}>
          <button type="button" className={styles.tile} onClick={() => onPick(id)}>
            <FoodTile category={id} size={40} />
            <span className={styles.text}>
              <span className={styles.name}>{categoryLabel(id)}</span>
              <span className={styles.count}>{getFoodsByCategory(id).length} foods</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
