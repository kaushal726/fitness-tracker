import { useEffect, useMemo, useState } from "react";
import { useBackLayer } from "../../app/useBackLayer.ts";
import { useAppState } from "../../data/store.ts";
import { mealForTime } from "../../domain/meals.ts";
import { hasFinePointer } from "../../lib/device.ts";
import { formatNumber } from "../../lib/format.ts";
import { categoryLabel } from "../../nutrition/categories.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { SearchInput } from "../../ui/SearchInput";
import { Sheet } from "../../ui/Sheet";
import { BrowseView } from "./BrowseView.tsx";
import { CartBar } from "./CartBar.tsx";
import { CategoryFoods } from "./CategoryFoods.tsx";
import { CustomFoodForm } from "./CustomFoodForm.tsx";
import { FoodsNotReady } from "./FoodsNotReady.tsx";
import { MealPicker } from "./MealPicker.tsx";
import { ReviewView } from "./ReviewView.tsx";
import { SearchResults } from "./SearchResults.tsx";
import { useAddSession } from "./useAddSession.ts";
import { useFoodPicker } from "./useFoodPicker.ts";
import { useFoodBrowser } from "./useFoodSearch.ts";

interface Props {
  onClose: () => void;
  /** The day being logged. */
  date: string;
  /** Preselect a meal (from a meal's own + button); null = by the time of day. */
  initialMeal: MealType | null;
}

/** The page the add flow lives on. Its views replace each other inside it, so nothing ever opens on top of it. */
type View = "browse" | "review" | "custom";

/**
 * Add food: find a food (type, tap a shortcut, or browse), set the amount where the food is, add. It stays open so
 * several foods can be logged in a row; Review lists them for changes, and Done closes.
 */
export function AddFood({ onClose, date, initialMeal }: Props) {
  const { settings } = useAppState();
  const [view, setView] = useState<View>("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  /** Null leaves the meal to the time of day. */
  const [mealChoice, setMealChoice] = useState<MealType | null>(initialMeal);
  const browser = useFoodBrowser(query);
  const session = useAddSession(date);
  const meal = mealChoice ?? mealForTime(new Date(), settings.mealStartHours);
  const picker = useFoodPicker({ browser, session, meal, mealChoice });

  const count = session.entries.length;
  const kcal = session.entries.reduce((sum, e) => sum + e.nutrition.calories, 0);
  const categoryFoods = useMemo(() => (category ? browser.inCategory(category) : []), [category, browser.inCategory]);

  // Everything was taken out from the list: there is nothing left to look over.
  useEffect(() => {
    if (view === "review" && count === 0) setView("browse");
  }, [view, count]);

  /** Where Back (the arrow, the phone's button, Escape) steps to before it closes the page. */
  const back = view !== "browse" ? () => setView("browse") : category ? () => setCategory(null) : undefined;
  useBackLayer(back !== undefined, () => back?.());

  const type = (value: string) => {
    setQuery(value);
    if (value.trim()) setCategory(null);
    picker.close();
  };
  const pickCategory = (id: string) => {
    setCategory(id);
    picker.close();
  };
  const openCustom = (name: string) => {
    setCustomName(name);
    setView("custom");
    picker.close();
  };
  /** The food they just made is found by its own name, with its amount card already open. */
  const created = (food: Food) => {
    setQuery(food.name);
    setCategory(null);
    setView("browse");
    picker.open("results", food);
  };

  const content = () => {
    if (view === "review") return <ReviewView session={session} />;
    if (view === "custom") return <CustomFoodForm initialName={customName} onCreated={created} />;
    if (browser.status !== "ready") return <FoodsNotReady status={browser.status} onRetry={browser.retry} />;
    if (query.trim() !== "") return <SearchResults key={query} query={query} results={browser.results} picker={picker} onCustom={openCustom} />;
    if (category) return <CategoryFoods key={category} foods={categoryFoods} picker={picker} onCustom={() => openCustom("")} />;
    return <BrowseView browser={browser} picker={picker} onPickCategory={pickCategory} />;
  };

  const header = {
    review: { title: "Added", subtitle: `${count} ${count === 1 ? "item" : "items"} · ${formatNumber(kcal)} kcal` },
    custom: { title: "Add your own food", subtitle: "Numbers for one serving" },
    browse: { title: category ? categoryLabel(category) : "Add food", subtitle: <MealPicker value={meal} onChange={setMealChoice} /> },
  }[view];

  return (
    <Sheet
      open
      size="page"
      onClose={onClose}
      onBack={back}
      title={header.title}
      subtitle={header.subtitle}
      toolbar={view === "browse" ? <SearchInput value={query} onChange={type} placeholder="Search dosa, chai, chicken…" autoFocus={hasFinePointer()} /> : undefined}
      footer={view !== "custom" && count > 0 ? <CartBar count={count} kcal={kcal} reviewing={view === "review"} onToggleReview={() => setView(view === "review" ? "browse" : "review")} onDone={onClose} /> : undefined}
    >
      {content()}
    </Sheet>
  );
}
