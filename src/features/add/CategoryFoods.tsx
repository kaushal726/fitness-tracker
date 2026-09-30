import { useMemo, useRef, useState } from "react";
import { useScrollTop } from "../../lib/useScrollTop.ts";
import { subCategoryCounts } from "../../nutrition/categories.ts";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { CustomFoodPrompt } from "./CustomFoodPrompt.tsx";
import { FoodRows } from "./FoodRows.tsx";
import type { FoodPicker } from "./useFoodPicker.ts";
import styles from "./CategoryFoods.module.css";

interface Props {
  /** Every food of the category, commonly eaten first. */
  foods: Food[];
  picker: FoodPicker;
  onCustom: () => void;
}

const PAGE_SIZE = 30;

/** One category, narrowed by sub-category, a page at a time: categories hold hundreds of foods. The page header names it. */
export function CategoryFoods({ foods, picker, onCustom }: Props) {
  const top = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const subs = useMemo(() => subCategoryCounts(foods), [foods]);
  const list = sub ? foods.filter((f) => f.subCategory === sub) : foods;

  // A category opens from the middle of the Browse list, and Browse should reappear at its top: start both at the top.
  useScrollTop(top);

  const pick = (next: string | null) => {
    setSub(next);
    setShown(PAGE_SIZE);
    picker.close();
  };

  return (
    <div ref={top}>
      {subs.length > 1 && (
        <div className={`scroll-row ${styles.subs}`} role="group" aria-label="Type of food">
          <Chip selected={sub === null} onClick={() => pick(null)}>All {foods.length}</Chip>
          {subs.map((s) => (
            <Chip key={s.id} selected={sub === s.id} onClick={() => pick(s.id)}>{s.label} {s.count}</Chip>
          ))}
        </div>
      )}
      <FoodRows slot="category" foods={list.slice(0, shown)} picker={picker} />
      {shown < list.length && (
        <Button block className={styles.more} onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more · {list.length - shown} left</Button>
      )}
      <CustomFoodPrompt onClick={onCustom} />
    </div>
  );
}
