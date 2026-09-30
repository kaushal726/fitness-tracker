import { useState } from "react";
import { defaultPortion } from "../../domain/portions.ts";
import { formatNumber } from "../../lib/format.ts";
import { MEAL_LABELS, mealForTime } from "../../domain/meals.ts";
import { useAppState } from "../../data/store.ts";
import { categoryLabel } from "../../nutrition/categories.ts";
import type { Entry } from "../../data/types.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { EmptyState } from "../../ui/EmptyState";
import { IconBack, IconEdit, IconSearch } from "../../ui/icons";
import { SearchInput } from "../../ui/SearchInput";
import { SectionLabel } from "../../ui/SectionLabel";
import { Sheet } from "../../ui/Sheet";
import { CategoryGrid } from "./CategoryGrid.tsx";
import { CustomFoodSheet } from "./CustomFoodSheet.tsx";
import { FoodList, FoodRow } from "./FoodRow.tsx";
import { PortionSheet } from "./PortionSheet.tsx";
import { useFoodBrowser } from "./useFoodSearch.ts";
import { useLogFood, type LogChoice } from "./useLogFood.ts";
import styles from "./AddFoodSheet.module.css";

interface Props {
  onClose: () => void;
  /** The day being logged. */
  date: string;
  /** Preselect a meal (from a meal's own + button); null = automatic. */
  initialMeal: MealType | null;
}

const SHORTLIST = 8;
const CATEGORY_SHORTLIST = 30;

/** Find a food (type, tap a shortcut, or browse), pick the amount, done. Stays open so several foods can be logged in a row. */
export function AddFoodSheet({ onClose, date, initialMeal }: Props) {
  const { settings, lastUsed, entries } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState<Food | null>(null);
  const [customFor, setCustomFor] = useState<string | null>(null);
  /** Ids of what was added while this sheet has been open, so it can total them (an Undo removes one from the total). */
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const browser = useFoodBrowser(query);
  const log = useLogFood(date);

  const addedEntries = entries.filter((e) => addedIds.includes(e.id));
  const addedKcal = addedEntries.reduce((sum, e) => sum + e.nutrition.calories, 0);
  const remember = (entry: Entry) => setAddedIds((ids) => [...ids, entry.id]);

  const searching = query.trim() !== "";
  const meal = initialMeal ?? mealForTime(new Date(), settings.mealStartHours);

  const list = searching ? browser.results : category ? browser.inCategory(category) : [];
  const limit = searching ? SHORTLIST : CATEGORY_SHORTLIST;
  const visible = showAll ? list : list.slice(0, limit);

  const rows = (foods: Food[]) => foods.map((f) => <FoodRow key={f.id} food={f} favorite={browser.isFavorite(f.id)} last={lastUsed[f.id]} onSelect={setPicked} />);

  const confirm = (choice: LogChoice) => {
    if (!picked) return;
    remember(log(picked, choice));
    setPicked(null);
    setQuery("");
    setCategory(null);
    setShowAll(false);
  };

  const type = (value: string) => {
    setQuery(value);
    setShowAll(false);
    if (value.trim()) setCategory(null);
  };

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title="Add food"
        subtitle={`Adding to ${MEAL_LABELS[meal]}`}
        size="full"
        footer={
          addedEntries.length > 0 ? (
            <div className={styles.summary}>
              <div className={styles.summaryText}>
                <span className={styles.summaryTitle}>{addedEntries.length} {addedEntries.length === 1 ? "item" : "items"} added</span>
                <span className={styles.summaryKcal}>{formatNumber(addedKcal)} kcal</span>
              </div>
              <Button variant="primary" size="lg" onClick={onClose}>Done</Button>
            </div>
          ) : undefined
        }
      >
        <div className={styles.search}>
          <SearchInput value={query} onChange={type} placeholder="Search dosa, chai, chicken…" autoFocus={!category} />
        </div>

        {!searching && !category && (
          <>
            <SectionLabel>Common foods</SectionLabel>
            <div className="scroll-row">
              {browser.quick.map((f) => <Chip key={f.id} selected={false} onClick={() => setPicked(f)}>{f.name}</Chip>)}
            </div>
            {browser.favorites.length > 0 && (
              <>
                <SectionLabel>Favourites</SectionLabel>
                <FoodList>{rows(browser.favorites)}</FoodList>
              </>
            )}
            {browser.recent.length > 0 && (
              <>
                <SectionLabel>Recently added</SectionLabel>
                <FoodList>{rows(browser.recent)}</FoodList>
              </>
            )}
            <SectionLabel>Browse</SectionLabel>
            <CategoryGrid onPick={(id) => { setCategory(id); setShowAll(false); }} />
          </>
        )}

        {!searching && category && (
          <>
            <div className={styles.categoryBar}>
              <Button size="sm" icon={<IconBack />} onClick={() => setCategory(null)}>All foods</Button>
              <h3 className={styles.categoryName}>{categoryLabel(category)}</h3>
            </div>
            <FoodList>{rows(visible)}</FoodList>
            {!showAll && list.length > limit && <Button block className={styles.more} onClick={() => setShowAll(true)}>Show all {list.length} foods</Button>}
          </>
        )}

        {searching && list.length > 0 && (
          <>
            <div className={styles.results}><FoodList>{rows(visible)}</FoodList></div>
            {!showAll && list.length > limit && <Button block className={styles.more} onClick={() => setShowAll(true)}>View all {list.length} results</Button>}
          </>
        )}

        {searching && list.length === 0 && (
          <EmptyState icon={<IconSearch />} title="No match yet" message="Try another spelling, or add it yourself in a few seconds." />
        )}

        {(searching || category !== null) && (
          <div className={styles.custom}>
            <p>Can't find your food?</p>
            <Button icon={<IconEdit />} onClick={() => setCustomFor(query.trim())}>Add custom food</Button>
          </div>
        )}
      </Sheet>

      {picked && (
        <PortionSheet
          key={picked.id}
          mode="add"
          food={picked}
          initial={defaultPortion(picked, lastUsed[picked.id])}
          initialMeal={initialMeal}
          onClose={() => setPicked(null)}
          onConfirm={confirm}
        />
      )}
      {customFor !== null && (
        <CustomFoodSheet initialName={customFor} onClose={() => setCustomFor(null)} onCreated={(food) => { setCustomFor(null); setPicked(food); }} />
      )}
    </>
  );
}
