import { categoryLabel } from "../../nutrition/categories.ts";
import type { LastUsed } from "../../data/types.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { Sheet } from "../../ui/Sheet";
import { FavoriteButton } from "./FavoriteButton.tsx";
import { FoodDetail } from "./FoodDetail.tsx";

interface Props {
  food: Food;
  initial: LastUsed;
  initialMeal: MealType;
  onClose: () => void;
  onConfirm: (choice: { quantity: number; unit: string; meal: MealType }) => void;
  onDelete: () => void;
}

/** Changing a logged entry from the day's list: how much, which meal, or take it out. */
export function PortionSheet({ food, initial, initialMeal, onClose, onConfirm, onDelete }: Props) {
  return (
    <Sheet open onClose={onClose} title={food.name} subtitle={categoryLabel(food.category)} headerAction={<FavoriteButton foodId={food.id} />}>
      <FoodDetail
        food={food}
        initial={initial}
        actionLabel="Save changes"
        edit={{ meal: initialMeal, onRemove: onDelete }}
        onSubmit={({ quantity, unit, meal }) => onConfirm({ quantity, unit, meal: meal ?? initialMeal })}
      />
    </Sheet>
  );
}
