import { useMemo, useRef, useState } from "react";
import { makeFoodLookup } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import { useScrollTop } from "../../lib/useScrollTop.ts";
import { FoodList } from "./FoodRow.tsx";
import { ReviewRow } from "./ReviewRow.tsx";
import type { AddSession } from "./useAddSession.ts";

interface Props {
  session: AddSession;
}

/** Everything added on this visit, newest first. Open any to change it or take it out; nothing has to wait for Done. */
export function ReviewView({ session }: Props) {
  const { customFoods } = useAppState();
  const lookup = useMemo(() => makeFoodLookup(customFoods), [customFoods]);
  const [openId, setOpenId] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  useScrollTop(top);

  return (
    <div ref={top}>
      <FoodList>
        {[...session.entries].reverse().map((entry) => (
          <ReviewRow
            key={entry.id}
            entry={entry}
            food={lookup(entry.foodId)}
            open={openId === entry.id}
            onToggle={() => setOpenId((id) => (id === entry.id ? null : entry.id))}
            onRevise={(choice) => {
              const food = lookup(entry.foodId);
              if (food) session.revise(entry, food, choice);
              setOpenId(null);
            }}
            onRemove={() => {
              session.remove(entry);
              setOpenId(null);
            }}
          />
        ))}
      </FoodList>
    </div>
  );
}
