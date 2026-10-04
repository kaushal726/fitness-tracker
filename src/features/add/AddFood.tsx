import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBackLayer } from "../../app/useBackLayer.ts";
import { makeFoodLookup } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { MEAL_LABELS, mealForTime } from "../../domain/meals.ts";
import { hasFinePointer } from "../../lib/device.ts";
import { formatNumber } from "../../lib/format.ts";
import { scrollParent } from "../../lib/scroll.ts";
import { categoryLabel } from "../../nutrition/categories.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { SearchInput } from "../../ui/SearchInput";
import { Sheet } from "../../ui/Sheet";
import { CartBar } from "./CartBar.tsx";
import { CustomFoodForm } from "./CustomFoodForm.tsx";
import { FavoriteButton } from "./FavoriteButton.tsx";
import type { PortionChoice } from "./FoodDetail.tsx";
import { FoodFinder } from "./FoodFinder.tsx";
import { MealPicker } from "./MealPicker.tsx";
import { ReviewView } from "./ReviewView.tsx";
import { SelectedFood, type Selected } from "./SelectedFood.tsx";
import { useAddSession } from "./useAddSession.ts";
import { useFoodBrowser } from "./useFoodSearch.ts";

interface Props {
  onClose: () => void;
  /** The day being logged. */
  date: string;
  /** Preselect a meal (from a meal's own + button); null = by the time of day. */
  initialMeal: MealType | null;
  /** Open on this food's amount, as when a suggestion was tapped. */
  initialFood?: Food;
}

/** The pages of the add flow. They replace each other inside one surface, so nothing opens on top of anything. */
type View = "add" | "review" | "custom";

/**
 * Add food: search or pick a food, say how much, add. It stays open so several foods can be logged in a row;
 * the bar at the foot lists them for changes, and Done closes.
 */
export function AddFood({ onClose, date, initialMeal, initialFood }: Props) {
  const { settings, customFoods } = useAppState();
  const [view, setView] = useState<View>("add");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  /** Null leaves the meal to the time of day. */
  const [mealChoice, setMealChoice] = useState<MealType | null>(initialMeal);
  /** The amount page, when one is open. It takes the place of the page underneath, which stays exactly as it was. */
  const [selected, setSelected] = useState<Selected | null>(initialFood ? { food: initialFood } : null);
  const browser = useFoodBrowser(query, category);
  const session = useAddSession(date);
  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const pages = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const meal = mealChoice ?? mealForTime(new Date(), settings.mealStartHours);

  const count = session.entries.length;
  const kcal = session.entries.reduce((sum, e) => sum + e.nutrition.calories, 0);

  // Coming back from the amount page lands on the same spot of the page it was opened from.
  useLayoutEffect(() => {
    if (!selected) scrollParent(pages.current)?.scrollTo({ top: savedScroll.current });
  }, [selected]);

  // Everything was taken out of the list: nothing is left to look over.
  useEffect(() => {
    if (view === "review" && count === 0) setView("add");
  }, [view, count]);

  /** Where Back (the arrow, the phone's button, Escape) steps to before it closes the flow. */
  const back = selected ? () => setSelected(null) : view !== "add" ? () => setView("add") : undefined;
  useBackLayer(back !== undefined, () => back?.());

  const open = (next: Selected) => {
    savedScroll.current = scrollParent(pages.current)?.scrollTop ?? 0;
    setSelected(next);
  };
  const edit = (entry: Entry) => {
    const food = lookup(entry.foodId);
    if (food) open({ food, entry });
  };
  const add = (food: Food, { quantity, unit }: PortionChoice) => {
    session.add(food, { quantity, unit, meal: mealChoice });
    setSelected(null);
  };
  const save = (entry: Entry, food: Food, { quantity, unit, meal: chosen }: PortionChoice) => {
    session.revise(entry, food, { quantity, unit, meal: chosen ?? entry.meal });
    setSelected(null);
  };
  const remove = (entry: Entry) => {
    session.remove(entry);
    setSelected(null);
  };
  const openCustom = (name: string) => {
    setCustomName(name);
    setView("custom");
  };
  /** The food they just made goes straight to its amount. */
  const created = (food: Food) => {
    setQuery(food.name);
    setCategory(null);
    setView("add");
    open({ food });
  };

  const header = () => {
    if (selected) return { title: selected.food.name, subtitle: categoryLabel(selected.food.category) };
    if (view === "review") return { title: "Added", subtitle: `${count} ${count === 1 ? "item" : "items"} · ${formatNumber(kcal)} kcal` };
    if (view === "custom") return { title: "Add your own food", subtitle: "Numbers for one serving" };
    return { title: "Add food", subtitle: <MealPicker value={meal} onChange={setMealChoice} /> };
  };
  const { title, subtitle } = header();

  return (
    <Sheet
      open
      size="page"
      onClose={onClose}
      onBack={back}
      title={title}
      subtitle={subtitle}
      headerAction={selected ? <FavoriteButton foodId={selected.food.id} /> : undefined}
      toolbar={view === "add" && !selected ? <SearchInput value={query} onChange={setQuery} placeholder="Search dosa, chai, chicken…" autoFocus={hasFinePointer()} /> : undefined}
      footer={!selected && view !== "custom" && count > 0 ? <CartBar count={count} kcal={kcal} reviewing={view === "review"} onToggleReview={() => setView(view === "review" ? "add" : "review")} onDone={onClose} /> : undefined}
    >
      <div ref={pages} hidden={selected !== null}>
        {view === "add" && <FoodFinder browser={browser} query={query} category={category} onCategory={setCategory} onSelect={(food) => open({ food })} onCustom={openCustom} />}
        {view === "review" && <ReviewView session={session} onEdit={edit} />}
        {view === "custom" && <CustomFoodForm initialName={customName} onCreated={created} />}
      </div>
      {selected && <SelectedFood selected={selected} addLabel={`Add to ${MEAL_LABELS[meal]}`} onAdd={add} onSave={save} onRemove={remove} />}
    </Sheet>
  );
}
