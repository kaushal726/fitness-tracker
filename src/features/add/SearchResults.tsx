import type { Food } from "../../nutrition/types.ts";
import { EmptyState } from "../../ui/EmptyState";
import { IconSearch } from "../../ui/icons";
import { CustomFoodPrompt } from "./CustomFoodPrompt.tsx";
import { PagedFoods } from "./PagedFoods.tsx";

interface Props {
  query: string;
  results: Food[];
  onSelect: (food: Food) => void;
  onCustom: (name: string) => void;
}

/** What matched. Nothing matching leads to adding the food by hand. */
export function SearchResults({ query, results, onSelect, onCustom }: Props) {
  return (
    <>
      {results.length > 0
        ? <PagedFoods foods={results} onSelect={onSelect} />
        : <EmptyState icon={<IconSearch />} title="No match yet" message="Try another spelling, or add it yourself in a few seconds." />}
      <CustomFoodPrompt onClick={() => onCustom(query.trim())} />
    </>
  );
}
