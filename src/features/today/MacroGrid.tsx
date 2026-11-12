import type { CSSProperties } from "react";
import type { Targets } from "../../data/types.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { MacroTile, type MacroAlert } from "./MacroTile.tsx";
import styles from "./MacroGrid.module.css";

const MACROS = [
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
  { key: "fiber", label: "Fiber" },
] as const;

interface Props {
  totals: NutritionTotals;
  targets: Targets;
  /** Its place on the page: it arrives after what is above it. */
  index: number;
  /** What is worth a look about a nutrient, shown on its own tile. */
  alerts?: Partial<Record<(typeof MACROS)[number]["key"], MacroAlert>>;
}

/** The four nutrients of the day, two across. */
export function MacroGrid({ totals, targets, index, alerts }: Props) {
  const animates = useAnimatesIn();
  return (
    <ul className={cx(styles.grid, animates && "motion-rise")} style={{ "--i": index } as CSSProperties} aria-label="Nutrients">
      {MACROS.map(({ key, label }) => (
        <MacroTile key={key} label={label} tone={key} value={totals[key]} target={targets[key]} alert={alerts?.[key]} />
      ))}
    </ul>
  );
}
