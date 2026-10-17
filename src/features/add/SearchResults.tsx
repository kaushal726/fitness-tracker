import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { IconSearch } from "../../ui/icons";
import { CustomFoodPrompt } from "./CustomFoodPrompt.tsx";
import { PagedFoods } from "./PagedFoods.tsx";
import styles from "./SearchResults.module.css";

interface Props {
  query: string;
  results: Food[];
  /** No food has every word typed: the list is the closest matches. */
  closest: boolean;
  onSelect: (food: Food) => void;
  onCustom: (name: string) => void;
}

/** What matched. Nothing matching leads to adding the food by hand, and so does a list that is only close. */
export function SearchResults({ query, results, closest, onSelect, onCustom }: Props) {
  return (
    <>
      {closest && results.length > 0 && (
        <div className={styles.note}>
          <p>No food has every word you typed. These are the closest.</p>
          <Button size="sm" variant="ghost" onClick={() => onCustom(query.trim())}>Add it yourself</Button>
        </div>
      )}
      {results.length > 0
        ? <PagedFoods foods={results} onSelect={onSelect} />
        : <EmptyState icon={<IconSearch />} title="No match yet" message="Try another spelling, or add it yourself in a few seconds." />}
      <CustomFoodPrompt onClick={() => onCustom(query.trim())} />
    </>
  );
}
