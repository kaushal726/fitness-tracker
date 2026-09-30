import { useMemo, useState } from "react";
import { subCategoryCounts } from "../../nutrition/categories.ts";
import type { Food } from "../../nutrition/types.ts";
import { Chip } from "../../ui/Chip";
import { ChipRow } from "../../ui/ChipRow";
import { CustomFoodPrompt } from "./CustomFoodPrompt.tsx";
import { PagedFoods } from "./PagedFoods.tsx";
import styles from "./CategoryFoods.module.css";

interface Props {
  /** Every food of the category, commonly eaten first. */
  foods: Food[];
  onSelect: (food: Food) => void;
  onCustom: () => void;
}

/** One category, narrowed by type of food when it is a big one. */
export function CategoryFoods({ foods, onSelect, onCustom }: Props) {
  const [sub, setSub] = useState<string | null>(null);
  const subs = useMemo(() => subCategoryCounts(foods), [foods]);
  const list = sub ? foods.filter((f) => f.subCategory === sub) : foods;

  return (
    <>
      {subs.length > 1 && (
        <ChipRow label="Type of food" className={styles.subs}>
          <Chip selected={sub === null} onClick={() => setSub(null)}>All {foods.length}</Chip>
          {subs.map((s) => <Chip key={s.id} selected={sub === s.id} onClick={() => setSub(s.id)}>{s.label} {s.count}</Chip>)}
        </ChipRow>
      )}
      <PagedFoods key={sub ?? "all"} foods={list} onSelect={onSelect} />
      <CustomFoodPrompt onClick={onCustom} />
    </>
  );
}
