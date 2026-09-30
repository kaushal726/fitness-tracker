import { useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { defaultPortion } from "../../domain/portions.ts";
import type { Food } from "../../nutrition/types.ts";
import { FoodDetail, type PortionChoice } from "./FoodDetail.tsx";

/** A food picked from the list (to add), or an entry picked from what was added (to change). */
export interface Selected {
  food: Food;
  entry?: Entry;
}

interface Props {
  selected: Selected;
  /** What the button says when adding. */
  addLabel: string;
  onAdd: (food: Food, choice: PortionChoice) => void;
  onSave: (entry: Entry, food: Food, choice: PortionChoice) => void;
  onRemove: (entry: Entry) => void;
}

/** The amount page for whichever of the two was picked. */
export function SelectedFood({ selected: { food, entry }, addLabel, onAdd, onSave, onRemove }: Props) {
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
  return <FoodDetail key={food.id} food={food} initial={defaultPortion(food, lastUsed[food.id])} actionLabel={addLabel} onSubmit={(choice) => onAdd(food, choice)} />;
}
