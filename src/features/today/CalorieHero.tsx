import type { Targets } from "../../data/types.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { IconButton } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { IconEaten, IconFlame, IconShare, IconTarget } from "../../ui/icons";
import { Ring } from "../../ui/Ring";
import { MacroTile } from "./MacroTile.tsx";
import styles from "./CalorieHero.module.css";

interface Props {
  totals: NutritionTotals;
  targets: Targets;
  /** Shows the share button in the corner; left out when there is nothing to share. */
  onShare?: () => void;
}

const RING_SIZE = 164;
const RING_STROKE = 16;

const MACROS = [
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
  { key: "fiber", label: "Fiber" },
] as const;

/** Calories first, in a ring; then the four macros, each in a ring of its own. */
export function CalorieHero({ totals, targets, onShare }: Props) {
  const animates = useAnimatesIn();
  const left = targets.calories - totals.calories;
  const over = left < 0;
  return (
    <Card tone="hero" className={cx(styles.hero, animates && "motion-rise")}>
      {onShare && <IconButton label="Share this day" icon={<IconShare />} variant="outline" className={styles.share} onClick={onShare} />}
      <div className={styles.top}>
        <Ring value={totals.calories} max={targets.calories} size={RING_SIZE} stroke={RING_STROKE} glow tone={over ? "over" : "primary"} label={`${formatNumber(totals.calories)} of ${formatNumber(targets.calories)} calories eaten`}>
          <IconFlame className={cx(styles.flame, over && styles.overValue)} aria-hidden />
          <span className={cx(styles.leftValue, over && styles.overValue, "num")}><CountUp value={Math.abs(left)} /></span>
          <span className={styles.leftLabel}>{over ? "kcal over" : "kcal left"}</span>
        </Ring>
        <ul className={styles.figures}>
          <li>
            <span className={styles.chip} aria-hidden><IconEaten /></span>
            <span className={styles.figure}>
              <span className={styles.figureLabel}>Eaten</span>
              <span className={cx(styles.figureValue, "num")}><CountUp value={totals.calories} /></span>
            </span>
          </li>
          <li>
            <span className={styles.chip} aria-hidden><IconTarget /></span>
            <span className={styles.figure}>
              <span className={styles.figureLabel}>Goal</span>
              <span className={cx(styles.figureValue, "num")}>{formatNumber(targets.calories)}</span>
            </span>
          </li>
        </ul>
      </div>

      <ul className={styles.macros}>
        {MACROS.map(({ key, label }) => (
          <MacroTile key={key} label={label} tone={key} value={totals[key]} target={targets[key]} />
        ))}
      </ul>
    </Card>
  );
}
