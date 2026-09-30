import { useState } from "react";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { IconSearch } from "../../ui/icons";
import { CustomFoodPrompt } from "./CustomFoodPrompt.tsx";
import { FoodRows } from "./FoodRows.tsx";
import type { FoodPicker } from "./useFoodPicker.ts";
import styles from "./SearchResults.module.css";

interface Props {
  query: string;
  results: Food[];
  picker: FoodPicker;
  onCustom: (name: string) => void;
}

const SHORTLIST = 8;

/** The best few matches, with the rest one tap away. Nothing matching leads to adding the food by hand. */
export function SearchResults({ query, results, picker, onCustom }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? results : results.slice(0, SHORTLIST);
  const addOwn = <CustomFoodPrompt onClick={() => onCustom(query.trim())} />;

  if (results.length === 0) {
    return (
      <>
        <EmptyState icon={<IconSearch />} title="No match yet" message="Try another spelling, or add it yourself in a few seconds." />
        {addOwn}
      </>
    );
  }

  return (
    <>
      <FoodRows slot="results" foods={visible} picker={picker} />
      {!showAll && results.length > SHORTLIST && <Button block className={styles.more} onClick={() => setShowAll(true)}>View all {results.length} results</Button>}
      {addOwn}
    </>
  );
}
