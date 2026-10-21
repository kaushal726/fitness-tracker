import { useAppState } from "../../data/store.ts";
import type { Entry, LastUsed } from "../../data/types.ts";
import { defaultPortion } from "../../domain/portions.ts";
import { CUSTOM_CATEGORY } from "../../nutrition/custom.ts";
import type { Food } from "../../nutrition/types.ts";
import { FoodDetail, type PortionChoice } from "./FoodDetail.tsx";

/** A food picked from the list (to add), or an entry picked from what was added (to change). */
export interface Selected {
  food: Food;
  entry?: Entry;
  /** The amount to open on, when the row it came from offered one; otherwise how the food was last had. */
  portion?: LastUsed;
}

interface Props {
  selected: Selected;
  /** What the button says when adding. */
  addLabel: string;
  onAdd: (food: Food, choice: PortionChoice) => void;
  onSave: (entry: Entry, food: Food, choice: PortionChoice) => void;
  onRemove: (entry: Entry) => void;
  /** Opens a food the person made, to change it. */
  onEditFood: (food: Food) => void;
}

/** The amount page for whichever of the two was picked. */
export function SelectedFood({ selected: { food, entry, portion }, addLabel, onAdd, onSave, onRemove, onEditFood }: Props) {
  const { lastUsed } = useAppState();
  if (entry) {
    return (
      <FoodDetail
        key={entry.id}
        food={food}
        initial={defaultPortion(food, { quantity: entry.quantity, unit: entry.unit })}
        actionLabel="Save changes"
        edit={{ meal: entry.meal, onRemove: () => onRemove(entry) }}
        onSubmit={(choice) => onSave(entry, food, choice)}
      />
    );
  }
  const editFood = food.category === CUSTOM_CATEGORY ? () => onEditFood(food) : undefined;
  return <FoodDetail key={food.id} food={food} initial={defaultPortion(food, portion ?? lastUsed[food.id])} actionLabel={addLabel} onSubmit={(choice) => onAdd(food, choice)} onEditFood={editFood} />;
}
