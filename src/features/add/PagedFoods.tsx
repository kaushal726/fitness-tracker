import { useState } from "react";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { FoodRows } from "./FoodRows.tsx";
import styles from "./PagedFoods.module.css";

interface Props {
  foods: Food[];
  onSelect: (food: Food) => void;
}

const PAGE_SIZE = 20;

/** A long list a page at a time: lists here can hold hundreds of foods. */
export function PagedFoods({ foods, onSelect }: Props) {
  const [shown, setShown] = useState(PAGE_SIZE);
  return (
    <>
      <FoodRows foods={foods.slice(0, shown)} onSelect={onSelect} />
      {shown < foods.length && (
        <Button block className={styles.more} onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more · {foods.length - shown} left</Button>
      )}
    </>
  );
}
