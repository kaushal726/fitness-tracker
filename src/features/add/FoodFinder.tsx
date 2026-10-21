import { Fragment } from "react";
import type { LastUsed } from "../../data/types.ts";
import type { Food } from "../../nutrition/types.ts";
import { SectionLabel } from "../../ui/SectionLabel";
import { CategoryChips } from "./CategoryChips.tsx";
import { CategoryFoods } from "./CategoryFoods.tsx";
import { FoodsNotReady } from "./FoodsNotReady.tsx";
import { SearchResults } from "./SearchResults.tsx";
import { SuggestionRows } from "./SuggestionRows.tsx";
import type { FoodBrowser } from "./useFoodSearch.ts";
import styles from "./FoodFinder.module.css";

interface Props {
  browser: FoodBrowser;
  query: string;
  category: string | null;
  /** Foods already added on this visit: their one-tap button shows as done. */
  addedFoodIds: Set<string>;
  onCategory: (category: string | null) => void;
  /** Opens a food's amount page, on the amount a suggestion offered if it did. */
  onSelect: (food: Food, portion?: LastUsed) => void;
  /** Adds a suggested food as it is, in the amount that is usual for it. */
  onQuickAdd: (food: Food, portion: LastUsed) => void;
  onCustom: (name: string) => void;
}

/** The one list of the add page: what the person usually has for the meal to start with, then a category, or what a search found. */
export function FoodFinder({ browser, query, category, addedFoodIds, onCategory, onSelect, onQuickAdd, onCustom }: Props) {
  if (browser.status !== "ready") return <FoodsNotReady status={browser.status} onRetry={browser.retry} />;

  const searching = query.trim() !== "";
  return (
    <>
      <CategoryChips value={category} onChange={onCategory} />
      {searching || category ? (
        <div className={styles.list}>
          {searching
            ? <SearchResults key={query} query={query} results={browser.results} closest={browser.closestMatches} onSelect={onSelect} onCustom={onCustom} />
            : <CategoryFoods key={category} foods={browser.inCategory} onSelect={onSelect} onCustom={() => onCustom("")} />}
        </div>
      ) : (
        browser.suggestions.map((section) => (
          <Fragment key={section.title}>
            <SectionLabel>{section.title}</SectionLabel>
            <SuggestionRows items={section.items} addedFoodIds={addedFoodIds} onSelect={onSelect} onQuickAdd={onQuickAdd} />
          </Fragment>
        ))
      )}
    </>
  );
}
