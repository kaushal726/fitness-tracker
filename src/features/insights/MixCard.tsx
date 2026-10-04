import { useMemo, useState } from "react";
import { mixByCategory, mixByCuisine, mixByDiet, treatShare, type MixRow } from "../../domain/foodMix.ts";
import { formatNumber } from "../../lib/format.ts";
import type { FoodLookup } from "../../data/selectors.ts";
import type { Entry } from "../../data/types.ts";
import { Segmented } from "../../ui/Segmented";
import { HBars, kcalText } from "./HBars.tsx";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./MixCard.module.css";

interface Props {
  /** The entries of the counted days. */
  entries: Entry[];
  lookup: FoodLookup;
  /** False until the food data has arrived: without it every food would read as "Other". */
  ready: boolean;
}

type View = "category" | "cuisine" | "diet";

const VIEWS: { value: View; label: string }[] = [
  { value: "category", label: "Kind" },
  { value: "cuisine", label: "Cuisine" },
  { value: "diet", label: "Veg and meat" },
];
const SHOWN = 6;

/** Where the calories came from by the kind of food, its cuisine, or whether it was plants, egg or meat; and how much were treats. */
export function MixCard({ entries, lookup, ready }: Props) {
  const [view, setView] = useState<View>("category");
  const rows = useMemo<MixRow[]>(() => {
    if (!ready) return [];
    return view === "category" ? mixByCategory(entries, lookup) : view === "cuisine" ? mixByCuisine(entries, lookup) : mixByDiet(entries, lookup);
  }, [entries, lookup, ready, view]);
  const treats = useMemo(() => (ready ? treatShare(entries, lookup) : null), [entries, lookup, ready]);
  const shown = rows.slice(0, SHOWN);

  return (
    <InsightCard label="What you eat" tag="By calories">
      <Segmented label="Cut the calories by" value={view} onChange={setView} options={VIEWS} />
      {!ready ? (
        <p className={styles.empty}>Loading the food list…</p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>Shows once a full day is logged.</p>
      ) : (
        <>
          <HBars title="Calories by kind of food" rows={shown.map((r) => ({ key: r.key, label: r.label, value: r.calories, text: kcalText(r.calories), hint: `${Math.round(r.share * 100)}%` }))} />
          {rows.length > SHOWN && <p className={styles.more}>and {formatNumber(rows.length - SHOWN)} more, {formatNumber(rows.slice(SHOWN).reduce((s, r) => s + r.share, 0) * 100)}% together</p>}
          {treats !== null && <p className={styles.treats}>Treats and packaged food were {Math.round(treats * 100)}% of the calories: sweets, desserts, fast food, bakery, fizzy drinks, alcohol and fried snacks.</p>}
        </>
      )}
    </InsightCard>
  );
}
