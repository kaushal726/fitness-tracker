import type { LastUsed } from "../../data/types.ts";
import type { Food } from "../../nutrition/types.ts";
import { FoodList, FoodRow } from "./FoodRow.tsx";
import type { Suggestion } from "./suggestions.ts";
import { UsualRow } from "./UsualRow.tsx";

interface Props {
  items: Suggestion[];
  addedFoodIds: Set<string>;
  onSelect: (food: Food, portion?: LastUsed) => void;
  onQuickAdd: (food: Food, portion: LastUsed) => void;
}

/** A suggested food with an amount is added in one tap; one without opens its amount page like any other row. */
export function SuggestionRows({ items, addedFoodIds, onSelect, onQuickAdd }: Props) {
  return (
    <FoodList>
      {items.map(({ food, portion, reason }, index) =>
        portion
          ? <UsualRow key={food.id} food={food} portion={portion} reason={reason} index={index} added={addedFoodIds.has(food.id)} onSelect={onSelect} onQuickAdd={onQuickAdd} />
          : <FoodRow key={food.id} food={food} index={index} onSelect={onSelect} />,
      )}
    </FoodList>
  );
}
