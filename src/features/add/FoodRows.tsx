import { defaultPortion } from "../../domain/portions.ts";
import type { Food } from "../../nutrition/types.ts";
import { AmountCard } from "./AmountCard.tsx";
import { FoodList, FoodRow } from "./FoodRow.tsx";
import type { FoodPicker } from "./useFoodPicker.ts";

/** The amount card for a food, wired to the page: it starts from how the food was last had and logs to the chosen meal. */
export function FoodCard({ food, picker }: { food: Food; picker: FoodPicker }) {
  return <AmountCard food={food} initial={defaultPortion(food, picker.last(food))} actionLabel={picker.actionLabel} onSubmit={(choice) => picker.add(food, choice)} />;
}

interface Props {
  /** Which list this is, so the picker opens a food in this list only. */
  slot: string;
  foods: Food[];
  picker: FoodPicker;
}

/** A list of foods; tapping one opens its amount card in place. */
export function FoodRows({ slot, foods, picker }: Props) {
  return (
    <FoodList>
      {foods.map((food) => (
        <FoodRow
          key={food.id}
          food={food}
          favorite={picker.isFavorite(food)}
          last={picker.last(food)}
          added={picker.isAdded(food)}
          expanded={picker.isOpen(slot, food)}
          onToggle={(f) => picker.toggle(slot, f)}
        >
          <FoodCard food={food} picker={picker} />
        </FoodRow>
      ))}
    </FoodList>
  );
}
