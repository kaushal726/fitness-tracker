import { SectionLabel } from "../../ui/SectionLabel";
import type { Food } from "../../nutrition/types.ts";
import { CategoryChips } from "./CategoryChips.tsx";
import { CategoryFoods } from "./CategoryFoods.tsx";
import { FoodRows } from "./FoodRows.tsx";
import { FoodsNotReady } from "./FoodsNotReady.tsx";
import { SearchResults } from "./SearchResults.tsx";
import type { FoodBrowser } from "./useFoodSearch.ts";
import styles from "./FoodFinder.module.css";

interface Props {
  browser: FoodBrowser;
  query: string;
  category: string | null;
  onCategory: (category: string | null) => void;
  onSelect: (food: Food) => void;
  onCustom: (name: string) => void;
}

/** The one list of the add page: a person's own foods to start with, then a category, or what a search found. */
export function FoodFinder({ browser, query, category, onCategory, onSelect, onCustom }: Props) {
  if (browser.status !== "ready") return <FoodsNotReady status={browser.status} onRetry={browser.retry} />;

  const searching = query.trim() !== "";
  const { suggestions } = browser;
  return (
    <>
      <CategoryChips value={category} onChange={onCategory} />
      {searching || category ? (
        <div className={styles.list}>
          {searching
            ? <SearchResults key={query} query={query} results={browser.results} onSelect={onSelect} onCustom={onCustom} />
            : <CategoryFoods key={category} foods={browser.inCategory} onSelect={onSelect} onCustom={() => onCustom("")} />}
        </div>
      ) : (
        <>
          <SectionLabel>{suggestions.title}</SectionLabel>
          <FoodRows foods={suggestions.foods} onSelect={onSelect} />
        </>
      )}
    </>
  );
}
