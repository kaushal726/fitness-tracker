import { reviseEntry } from "../../data/entries.ts";
import { makeFoodLookup } from "../../data/selectors.ts";
import { addEntry, removeEntry, replaceEntry, useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import { useToast } from "../../ui/Toast";
import { PortionSheet } from "../add/PortionSheet.tsx";

interface Props {
  entry: Entry;
  onClose: () => void;
}

export function EditEntrySheet({ entry, onClose }: Props) {
  const { customFoods } = useAppState();
  const toast = useToast();
  const food = makeFoodLookup(customFoods)(entry.foodId);

  const remove = () => {
    const removed = removeEntry(entry.id);
    onClose();
    if (removed) toast(`Removed ${removed.name}`, { action: { label: "Undo", onClick: () => addEntry(removed) } });
  };

  // A custom food that was deleted later: the entry still reads right, it just cannot be re-sized.
  if (!food) {
    return (
      <Sheet open onClose={onClose} title={entry.name} subtitle={entry.portionText} footer={<Button block variant="danger" size="lg" onClick={remove}>Delete entry</Button>}>
        <p>This food is no longer in your list, so its amount cannot be changed. You can still delete the entry.</p>
      </Sheet>
    );
  }

  return (
    <PortionSheet
      mode="edit"
      food={food}
      initial={{ quantity: entry.quantity, unit: entry.unit }}
      initialMeal={entry.meal}
      onClose={onClose}
      onDelete={remove}
      onConfirm={({ quantity, unit, meal }) => {
        replaceEntry(reviseEntry(entry, food, quantity, unit, meal ?? entry.meal));
        onClose();
      }}
    />
  );
}
