import type { Profile } from "../../data/types.ts";
import type { GoalDef } from "../../domain/goals.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { signedKg, type WeighInTrend, type WeightPoint, weighInSummary } from "../../domain/weighIns.ts";
import { formatDate } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { Button } from "../../ui/Button";
import { IconCheck, IconScale, IconTrendDown, IconTrendUp } from "../../ui/icons";
import { InsightCard } from "../insights/InsightCard.tsx";
import { Readout } from "../insights/Readout.tsx";
import { WeighInChart } from "./WeighInChart.tsx";
import styles from "./WeighInsCard.module.css";

interface Props {
  profile: Profile;
  goal: GoalDef;
  /** Every weigh-in, oldest first. */
  points: WeightPoint[];
  onLog: () => void;
}

/** Weigh-ins kept on the chart: about three months of Saturdays. */
const SHOWN = 12;
const SHORT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

function trendLine(trend: WeighInTrend, direction: GoalDef["direction"], changeKg: number): string {
  if (trend === "steady") return direction === 0 ? "Holding steady, as planned" : "Holding steady since last time";
  if (direction === 0) return `${changeKg > 0 ? "Up" : "Down"} ${formatKg(changeKg)} since last time`;
  return trend === "toward" ? "Moving toward your target" : "Moving away from your target";
}

/** The real weights from the scale, week by week: how far they have come, which way the last one went, and what is left. */
export function WeighInsCard({ profile, goal, points, onLog }: Props) {
  const target = goal.direction === 0 ? null : profile.targetWeightKg;
  const summary = weighInSummary(points, goal.direction, target);
  const shown = points.slice(-SHOWN);
  const TrendIcon = summary?.changeKg && summary.changeKg < 0 ? IconTrendDown : IconTrendUp;

  return (
    <InsightCard label="Weekly weigh-ins" tag="Every Saturday">
      {!summary ? (
        <Readout value="–" caption="Log your weight each Saturday to see the real trend" />
      ) : (
        <>
          <Readout
            value={points.length > 1 ? signedKg(summary.totalKg) : formatKg(summary.latest.kg).replace(" kg", "")}
            unit="kg"
            caption={points.length > 1 ? `Since ${formatDate(points[0].date, SHORT)}, over ${points.length} weigh-ins` : `Weighed on ${formatDate(summary.latest.date, SHORT)}`}
          />
          {summary.trend && summary.changeKg !== null && (
            <p className={cx(styles.trend, styles[summary.trend])}>
              {summary.trend === "steady" ? <IconCheck aria-hidden /> : <TrendIcon aria-hidden />}
              <span>{trendLine(summary.trend, goal.direction, summary.changeKg)}</span>
              <b className="num">{signedKg(summary.changeKg)} kg</b>
            </p>
          )}
          <WeighInChart points={shown} targetKg={target} />
          <dl className={styles.stats}>
            <div>
              <dt>First</dt>
              <dd className="num">{formatKg(points[0].kg)}</dd>
            </div>
            <div>
              <dt>Now</dt>
              <dd className="num">{formatKg(summary.latest.kg)}</dd>
            </div>
            <div>
              <dt>{target === null ? "Goal" : "To go"}</dt>
              <dd className="num">{target === null ? "Keep" : summary.reached ? "Reached" : formatKg(summary.toGoKg ?? 0)}</dd>
            </div>
          </dl>
        </>
      )}
      <Button variant="secondary" size="md" block icon={<IconScale />} onClick={onLog}>Log this week's weight</Button>
    </InsightCard>
  );
}
