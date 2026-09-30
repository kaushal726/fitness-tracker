import { reviseEntry } from "../../data/entries.ts";
import { makeFoodLookup } from "../../data/selectors.ts";
import { replaceEntry, useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import { FoodsNotReady } from "./FoodsNotReady.tsx";
import { PortionSheet } from "./PortionSheet.tsx";
import { useFoods } from "./useFoods.ts";
import { useRemoveEntry } from "./useRemoveEntry.ts";

interface Props {
  entry: Entry;
  onClose: () => void;
}

export function EditEntrySheet({ entry, onClose }: Props) {
  const { customFoods } = useAppState();
  const removeEntry = useRemoveEntry();
  const { status, retry } = useFoods();

  const remove = () => {
    removeEntry(entry);
    onClose();
  };
  const deleteButton = <Button block variant="danger" size="lg" onClick={remove}>Delete entry</Button>;

  // The food data is a lazy download: until it is here a food cannot be looked up, and the entry can still be deleted.
  if (status !== "ready") {
    return (
      <Sheet open onClose={onClose} title={entry.name} subtitle={entry.portionText} footer={deleteButton}>
        <FoodsNotReady status={status} onRetry={retry} rows={2} />
      </Sheet>
    );
  }

  const food = makeFoodLookup(customFoods)(entry.foodId);

  // A custom food that was deleted later: the entry still reads right, it just cannot be re-sized.
  if (!food) {
    return (
      <Sheet open onClose={onClose} title={entry.name} subtitle={entry.portionText} footer={deleteButton}>
        <p>This food is no longer in your list, so its amount cannot be changed. You can still delete the entry.</p>
      </Sheet>
    );
  }

  return (
    <PortionSheet
      food={food}
      initial={{ quantity: entry.quantity, unit: entry.unit }}
      initialMeal={entry.meal}
      onClose={onClose}
      onDelete={remove}
      onConfirm={({ quantity, unit, meal }) => {
        replaceEntry(reviseEntry(entry, food, quantity, unit, meal));
        onClose();
      }}
    />
  );
}
