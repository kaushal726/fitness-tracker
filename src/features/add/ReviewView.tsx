import { useMemo, useRef } from "react";
import { makeFoodLookup } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Entry } from "../../data/types.ts";
import { useScrollTop } from "../../lib/useScrollTop.ts";
import { FoodList } from "./FoodRow.tsx";
import { ReviewRow } from "./ReviewRow.tsx";
import type { AddSession } from "./useAddSession.ts";

interface Props {
  session: AddSession;
  onEdit: (entry: Entry) => void;
}

/** Everything added on this visit, newest first. Nothing has to wait for Done to be put right. */
export function ReviewView({ session, onEdit }: Props) {
  const { customFoods } = useAppState();
  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const top = useRef<HTMLDivElement>(null);
  useScrollTop(top);

  return (
    <div ref={top}>
      <FoodList>
        {[...session.entries].reverse().map((entry) => (
          <ReviewRow key={entry.id} entry={entry} editable={lookup(entry.foodId) !== undefined} onEdit={() => onEdit(entry)} onRemove={() => session.remove(entry)} />
        ))}
      </FoodList>
    </div>
  );
}
