import { addEntry, removeEntry } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { useToast } from "../../ui/Toast";

/** Takes a logged entry out, and offers the way back. */
export function useRemoveEntry(): (entry: Entry) => void {
  const toast = useToast();
  return (entry) => {
    const removed = removeEntry(entry.id);
    if (removed) toast(`Removed ${removed.name}`, { action: { label: "Undo", onClick: () => addEntry(removed) } });
  };
}
