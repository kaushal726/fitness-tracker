import { categoryIds, categoryLabel } from "../../nutrition/categories.ts";
import { Chip } from "../../ui/Chip";
import { ChipRow } from "../../ui/ChipRow";

interface Props {
  /** Null = every food. */
  value: string | null;
  onChange: (category: string | null) => void;
}

/** One row to narrow the list to a kind of food. */
export function CategoryChips({ value, onChange }: Props) {
  return (
    <ChipRow label="Kind of food">
      <Chip selected={value === null} onClick={() => onChange(null)}>All</Chip>
      {categoryIds().map((id) => (
        <Chip key={id} selected={value === id} onClick={() => onChange(value === id ? null : id)}>{categoryLabel(id)}</Chip>
      ))}
    </ChipRow>
  );
}
