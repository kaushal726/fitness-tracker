import { useMemo, useState } from "react";
import { defaultPortion } from "../../domain/portions.ts";
import { MEAL_LABELS, mealForTime } from "../../domain/meals.ts";
import { useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { EmptyState } from "../../ui/EmptyState";
import { IconEdit, IconSearch } from "../../ui/icons";
import { SearchInput } from "../../ui/SearchInput";
import { SectionLabel } from "../../ui/SectionLabel";
import { Sheet } from "../../ui/Sheet";
import { AddedCart } from "./AddedCart.tsx";
import { CategoryFoods } from "./CategoryFoods.tsx";
import { CategoryGrid } from "./CategoryGrid.tsx";
import { CustomFoodSheet } from "./CustomFoodSheet.tsx";
import { EditEntrySheet } from "./EditEntrySheet.tsx";
import { FoodList, FoodRow } from "./FoodRow.tsx";
import { FoodsNotReady } from "./FoodsNotReady.tsx";
import { PortionSheet } from "./PortionSheet.tsx";
import { useFoodBrowser } from "./useFoodSearch.ts";
import { useLogFood, type LogChoice } from "./useLogFood.ts";
import { useRemoveEntry } from "./useRemoveEntry.ts";
import styles from "./AddFoodSheet.module.css";

interface Props {
  onClose: () => void;
  /** The day being logged. */
  date: string;
  /** Preselect a meal (from a meal's own + button); null = automatic. */
  initialMeal: MealType | null;
}

const SHORTLIST = 8;

/** Find a food (type, tap a shortcut, or browse), pick the amount, done. Stays open so several foods can be logged in a row. */
export function AddFoodSheet({ onClose, date, initialMeal }: Props) {
  const { settings, lastUsed, entries } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState<Food | null>(null);
  const [customFor, setCustomFor] = useState<string | null>(null);
  /** Ids of what was added while this sheet has been open. What was since changed or removed follows from the store. */
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const browser = useFoodBrowser(query);
  const log = useLogFood(date);
  const removeEntry = useRemoveEntry();

  const addedEntries = entries.filter((e) => addedIds.includes(e.id));
  const editing = addedEntries.find((e) => e.id === editingId);
  const remember = (entry: Entry) => setAddedIds((ids) => [...ids, entry.id]);

  const searching = query.trim() !== "";
  const meal = initialMeal ?? mealForTime(new Date(), settings.mealStartHours);

  const categoryFoods = useMemo(() => (category ? browser.inCategory(category) : []), [category, browser.inCategory]);
  const visible = showAll ? browser.results : browser.results.slice(0, SHORTLIST);

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
        footer={addedEntries.length > 0 ? <AddedCart entries={addedEntries} onEdit={(e) => setEditingId(e.id)} onRemove={removeEntry} onDone={onClose} /> : undefined}
      >
        <div className={styles.search}>
          <SearchInput value={query} onChange={type} placeholder="Search dosa, chai, chicken…" autoFocus={!category} />
        </div>

        {browser.status !== "ready" && <FoodsNotReady status={browser.status} onRetry={browser.retry} />}

        {browser.status === "ready" && !searching && !category && (
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
            <CategoryGrid onPick={setCategory} />
          </>
        )}

        {browser.status === "ready" && !searching && category && (
          <CategoryFoods key={category} category={category} foods={categoryFoods} renderFoods={rows} onBack={() => setCategory(null)} />
        )}

        {browser.status === "ready" && searching && browser.results.length > 0 && (
          <>
            <div className={styles.results}><FoodList>{rows(visible)}</FoodList></div>
            {!showAll && browser.results.length > SHORTLIST && <Button block className={styles.more} onClick={() => setShowAll(true)}>View all {browser.results.length} results</Button>}
          </>
        )}

        {browser.status === "ready" && searching && browser.results.length === 0 && (
          <EmptyState icon={<IconSearch />} title="No match yet" message="Try another spelling, or add it yourself in a few seconds." />
        )}

        {browser.status === "ready" && (searching || category !== null) && (
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
      {editing && <EditEntrySheet entry={editing} onClose={() => setEditingId(null)} />}
      {customFor !== null && (
        <CustomFoodSheet initialName={customFor} onClose={() => setCustomFor(null)} onCreated={(food) => { setCustomFor(null); setPicked(food); }} />
      )}
    </>
  );
}
