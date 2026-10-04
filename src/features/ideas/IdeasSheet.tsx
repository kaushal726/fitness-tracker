import type { DayIdeas } from "../../domain/ideas.ts";
import type { Food } from "../../nutrition/types.ts";
import { Sheet } from "../../ui/Sheet";
import { DayIdeasList } from "./DayIdeasList.tsx";

interface Props {
  groups: DayIdeas[];
  onClose: () => void;
  onPick: (food: Food) => void;
}

/** Opens from the line on Today when the day is off course: a few foods that would help, a tap from adding one. */
export function IdeasSheet({ groups, onClose, onPick }: Props) {
  return (
    <Sheet open onClose={onClose} title="Ideas for today" subtitle="What would put the day right">
      <DayIdeasList groups={groups} onPick={onPick} />
    </Sheet>
  );
}
