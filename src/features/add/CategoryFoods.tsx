import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { scrollParent } from "../../lib/scroll.ts";
import { categoryLabel, subCategoryCounts } from "../../nutrition/categories.ts";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { IconBack } from "../../ui/icons";
import { FoodList } from "./FoodRow.tsx";
import styles from "./CategoryFoods.module.css";

interface Props {
  category: string;
  /** Every food of the category, commonly eaten first. */
  foods: Food[];
  /** Draws the rows for the foods it is given. */
  renderFoods: (foods: Food[]) => ReactNode;
  onBack: () => void;
}

const PAGE_SIZE = 30;

/** One category, narrowed by sub-category, a page at a time: categories hold hundreds of foods. */
export function CategoryFoods({ category, foods, renderFoods, onBack }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const subs = useMemo(() => subCategoryCounts(foods), [foods]);
  const list = sub ? foods.filter((f) => f.subCategory === sub) : foods;

  // A category opens from the middle of the Browse list, and Browse should reappear at its top: start both at the top.
  useEffect(() => {
    const parent = scrollParent(barRef.current);
    const toTop = () => parent?.scrollTo({ top: 0 });
    toTop();
    return toTop;
  }, []);

  const pick = (next: string | null) => {
    setSub(next);
    setShown(PAGE_SIZE);
  };

  return (
    <>
      <div ref={barRef} className={styles.bar}>
        <Button size="sm" icon={<IconBack />} onClick={onBack}>All foods</Button>
        <h3 className={styles.name}>{categoryLabel(category)}</h3>
      </div>
      {subs.length > 1 && (
        <div className={`scroll-row ${styles.subs}`} role="group" aria-label="Type of food">
          <Chip selected={sub === null} onClick={() => pick(null)}>All {foods.length}</Chip>
          {subs.map((s) => (
            <Chip key={s.id} selected={sub === s.id} onClick={() => pick(s.id)}>{s.label} {s.count}</Chip>
          ))}
        </div>
      )}
      <FoodList>{renderFoods(list.slice(0, shown))}</FoodList>
      {shown < list.length && (
        <Button block className={styles.more} onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more · {list.length - shown} left</Button>
      )}
    </>
  );
}
