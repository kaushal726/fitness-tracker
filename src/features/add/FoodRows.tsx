import type { Food } from "../../nutrition/types.ts";
import { FoodList, FoodRow } from "./FoodRow.tsx";

interface Props {
  foods: Food[];
  onSelect: (food: Food) => void;
}

export function FoodRows({ foods, onSelect }: Props) {
  return (
    <FoodList>
      {foods.map((food) => <FoodRow key={food.id} food={food} onSelect={onSelect} />)}
    </FoodList>
  );
}
