import type { Targets } from "../../data/types.ts";
import { calorieBalance } from "../../domain/dayReport.ts";
import type { CalorieStatus } from "../../domain/insights.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { IconAlert, IconCheck, IconChevronRight, IconEaten, IconFlame, IconShare, IconTarget, IconZap } from "../../ui/icons";
import { Ring } from "../../ui/Ring";
import { GaugeTicks } from "./GaugeTicks.tsx";
import styles from "./CalorieHero.module.css";

interface Props {
  totals: NutritionTotals;
  targets: Targets;
  /** How the day stands, as a small tag beside the title. */
  status: CalorieStatus | null;
  /** Given when there are foods that would help: the "over" tag opens them. */
  onSeeIdeas?: () => void;
  /** Shows the share button in the corner; left out when there is nothing to share. */
  onShare?: () => void;
}

const STATUS = {
  over: { text: "Over goal", Icon: IconAlert },
  onTrack: { text: "On track", Icon: IconCheck },
} as const;

const GAUGE_SIZE = 204;
const GAUGE_STROKE = 18;
/** The gauge is open at the bottom: this much of a circle is drawn. */
const GAUGE_SWEEP = 264;
/** How far the speedometer ticks reach outside the gauge. */
const TICK_REACH = 20;
const PERCENT = 100;

/** The day's calories: a gauge of how much is left, and what was eaten against the goal under it. */
export function CalorieHero({ totals, targets, status, onSeeIdeas, onShare }: Props) {
  const animates = useAnimatesIn();
  const { over, amount } = calorieBalance(totals.calories, targets.calories);
  const used = targets.calories > 0 ? Math.round((totals.calories / targets.calories) * PERCENT) : 0;
  return (
    <Card tone="lead" padded={false} className={cx(styles.hero, over && styles.over, animates && "motion-rise")} role="region" aria-label="Calories">
      <header className={styles.head}>
        <span className={styles.title}><IconFlame className={styles.flame} aria-hidden /> Calories</span>
        {status && <StatusTag status={status} onOpen={status === "over" ? onSeeIdeas : undefined} />}
        {onShare && (
          <button type="button" className={styles.share} onClick={onShare} aria-label="Share this day" title="Share this day">
            <IconShare aria-hidden />
          </button>
        )}
      </header>

      <div className={styles.gauge}>
        <div className={styles.dial}>
          <span className={styles.orbit} aria-hidden><i /><i /><i /></span>
          <GaugeTicks ringSize={GAUGE_SIZE} reach={TICK_REACH} sweep={GAUGE_SWEEP} share={targets.calories > 0 ? totals.calories / targets.calories : 0} />
          <Ring className={styles.ring} value={totals.calories} max={targets.calories} size={GAUGE_SIZE} stroke={GAUGE_STROKE} sweep={GAUGE_SWEEP} glow knob shine label={`${formatNumber(totals.calories)} of ${formatNumber(targets.calories)} calories eaten`}>
          <span className={cx(styles.leftValue, "num")}><CountUp value={amount} /></span>
          <span className={styles.leftLabel}>{over ? "kcal over" : "kcal left"}</span>
          </Ring>
        </div>
      </div>

      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt><IconEaten aria-hidden /> Eaten</dt>
          <dd className="num"><CountUp value={totals.calories} /></dd>
        </div>
        <div className={styles.figure}>
          <dt><IconTarget aria-hidden /> Goal</dt>
          <dd className="num">{formatNumber(targets.calories)}</dd>
        </div>
        <div className={styles.figure}>
          <dt><IconZap aria-hidden /> Used</dt>
          <dd className="num"><CountUp value={used} />%</dd>
        </div>
      </dl>
    </Card>
  );
}

/** "On track" or "Over goal" beside the title; over, it opens foods that would help when there are some. */
function StatusTag({ status, onOpen }: { status: CalorieStatus; onOpen?: () => void }) {
  const { text, Icon } = STATUS[status];
  const className = cx(styles.status, styles[status]);
  const content = <><Icon aria-hidden /> {text}{onOpen && <IconChevronRight className={styles.statusMore} aria-hidden />}</>;
  return onOpen ? (
    <button type="button" className={className} onClick={onOpen} aria-haspopup="dialog">{content}</button>
  ) : (
    <span className={className} role="status">{content}</span>
  );
}
