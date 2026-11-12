import type { Targets } from "../../data/types.ts";
import { calorieBalance } from "../../domain/dayReport.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { IconFlame, IconShare } from "../../ui/icons";
import { Ring } from "../../ui/Ring";
import styles from "./CalorieHero.module.css";

interface Props {
  totals: NutritionTotals;
  targets: Targets;
  /** Shows the share button in the corner; left out when there is nothing to share. */
  onShare?: () => void;
}

const GAUGE_SIZE = 204;
const GAUGE_STROKE = 18;
/** The gauge is open at the bottom: this much of a circle is drawn. */
const GAUGE_SWEEP = 264;
const PERCENT = 100;

/** The day's calories: a gauge of how much is left, and what was eaten against the goal under it. */
export function CalorieHero({ totals, targets, onShare }: Props) {
  const animates = useAnimatesIn();
  const { over, amount } = calorieBalance(totals.calories, targets.calories);
  const used = targets.calories > 0 ? Math.round((totals.calories / targets.calories) * PERCENT) : 0;
  return (
    <Card tone="lead" padded={false} className={cx(styles.hero, over && styles.over, animates && "motion-rise")} role="region" aria-label="Calories">
      <header className={styles.head}>
        <span className={styles.title}><IconFlame aria-hidden /> Calories</span>
        {onShare && (
          <button type="button" className={styles.share} onClick={onShare} aria-label="Share this day" title="Share this day">
            <IconShare aria-hidden />
          </button>
        )}
      </header>

      <div className={styles.gauge}>
        <Ring className={styles.ring} value={totals.calories} max={targets.calories} size={GAUGE_SIZE} stroke={GAUGE_STROKE} sweep={GAUGE_SWEEP} glow label={`${formatNumber(totals.calories)} of ${formatNumber(targets.calories)} calories eaten`}>
          <span className={cx(styles.leftValue, "num")}><CountUp value={amount} /></span>
          <span className={styles.leftLabel}>{over ? "kcal over" : "kcal left"}</span>
        </Ring>
      </div>

      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt>Eaten</dt>
          <dd className="num"><CountUp value={totals.calories} /></dd>
        </div>
        <div className={styles.figure}>
          <dt>Goal</dt>
          <dd className="num">{formatNumber(targets.calories)}</dd>
        </div>
        <div className={styles.figure}>
          <dt>Used</dt>
          <dd className="num"><CountUp value={used} />%</dd>
        </div>
      </dl>
    </Card>
  );
}
