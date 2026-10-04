import type { Profile } from "../../data/types.ts";
import { progressNote, formatKg } from "../../domain/progressNote.ts";
import { formatDate } from "../../lib/dates.ts";
import { formatSpan, spanParts } from "../../lib/duration.ts";
import { formatNumber } from "../../lib/format.ts";
import { Button } from "../../ui/Button";
import { signed } from "../insights/chartScale.ts";
import { InsightCard } from "../insights/InsightCard.tsx";
import { InsightNote } from "../insights/InsightNote.tsx";
import { Readout } from "../insights/Readout.tsx";
import type { BodyView } from "./useBodyProgress.ts";
import { WeightPathChart } from "./WeightPathChart.tsx";
import styles from "./ProgressCard.module.css";

interface Props {
  profile: Profile;
  view: BodyView;
  onUpdateWeight: () => void;
}

/** A change in kilograms with a real minus sign, one decimal. */
const signedKg = (kg: number): string => {
  const rounded = Math.round(kg * 10) / 10;
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${Math.abs(rounded)}` : "0";
};

/** "5 months" with the unit small, like the other tiles; years read "over 2 years". */
function EtaSpan({ days }: { days: number }) {
  const { prefix, value, unit } = spanParts(days);
  return <>{prefix}{value}<small> {unit}</small></>;
}

/**
 * What the food has done to the weight so far, how fast, and how long it is to the goal at that pace. All of it is an
 * estimate from the logged days against what the body uses.
 */
export function ProgressCard({ profile, view, onUpdateWeight }: Props) {
  const { progress: p, plan, goal } = view;
  const target = p.target;
  const note = progressNote(p, { direction: goal.direction, tdee: plan.tdee, planCalories: plan.targets.calories });

  return (
    <InsightCard label="Goal progress" tag={target ? `${formatKg(target.kg)} target` : goal.label}>
      {p.countedDays === 0 ? (
        <Readout value="–" caption="Starts once a full day is logged" />
      ) : (
        <Readout
          value={signedKg(p.changeKg)}
          unit="kg"
          caption={`Estimated since ${formatDate(p.since, { day: "numeric", month: "short" })}, from ${p.countedDays} of ${Math.max(p.elapsedDays, p.countedDays)} days logged`}
        />
      )}

      {target && (
        <div className={styles.way}>
          <div className={styles.meter} role="progressbar" aria-label="Way from your first weight to the target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(target.fraction * 100)}>
            <span className={styles.fill} style={{ width: `${target.fraction * 100}%` }} />
          </div>
          <div className={styles.ends}>
            <span>{formatKg(p.startKg)}</span>
            <span className={styles.togo}>{target.status === "reached" ? "Reached" : `${formatKg(target.toGoKg)} to go`}</span>
            <span>{formatKg(target.kg)}</span>
          </div>
        </div>
      )}

      <dl className={styles.stats}>
        <div>
          <dt>Daily gap</dt>
          <dd>{p.avgNetKcal === null ? "–" : signed(p.avgNetKcal)}<small> kcal</small></dd>
        </div>
        <div>
          <dt>Pace</dt>
          <dd>{p.kgPerWeek === null ? "–" : signedKg(p.kgPerWeek)}<small> kg/week</small></dd>
        </div>
        <div>
          <dt>To goal</dt>
          <dd>{target?.status === "heading" && target.etaDays !== null ? <EtaSpan days={target.etaDays} /> : "–"}</dd>
        </div>
      </dl>

      {p.countedDays > 0 && <WeightPathChart progress={p} />}
      <InsightNote note={note} />

      {profile.goal !== "maintain" && plan.estimatedWeeks !== null && (
        <p className={styles.plan}>Your plan aims for {formatKg(plan.weeklyChangeKg)} a week and {formatNumber(plan.targets.calories)} kcal a day: about {formatSpan(plan.estimatedWeeks * 7)} in all.</p>
      )}
      <p className={styles.foot}>An estimate: the food you log against what your body uses, 7,700 kcal to a kilo. Days with nothing logged are left out.</p>
      <Button variant="secondary" size="md" block onClick={onUpdateWeight}>Weighed yourself? Update your weight</Button>
    </InsightCard>
  );
}
