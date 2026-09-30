import type { Plan } from "../../domain/goals.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { Card } from "../../ui/Card";
import { CountUp } from "../../ui/CountUp";
import { paceSentence } from "./pace.ts";
import styles from "./PlanPreview.module.css";

const MACROS = [
  { key: "protein", label: "Protein", tone: styles.protein },
  { key: "carbs", label: "Carbs", tone: styles.carbs },
  { key: "fat", label: "Fat", tone: styles.fat },
  { key: "fiber", label: "Fiber", tone: styles.fiber },
] as const;

interface Props {
  plan: Plan;
  /** How long the person asked for, so the note can say whether the plan differs much. */
  requestedWeeks?: number | null;
  /** Count up from zero on first paint: for the reveal at the end of setup. */
  reveal?: boolean;
}

export function PlanPreview({ plan, requestedWeeks, reveal }: Props) {
  const pace = paceSentence(plan, requestedWeeks);
  const note = plan.custom ? "You set this target yourself." : pace ? pace.text : "This matches what your body uses in a day.";
  return (
    <Card tone="hero" className={styles.plan}>
      <p className={styles.label}>Daily calories</p>
      <p className={styles.calories}>
        <span className="num"><CountUp value={plan.targets.calories} from={reveal ? 0 : undefined} /></span>
        <small>kcal</small>
      </p>
      <ul className={styles.macros}>
        {MACROS.map((m) => (
          <li key={m.key} className={m.tone}>
            <span className={styles.macroLabel}>{m.label}</span>
            <span className={styles.macroValue}>{formatNumber(plan.targets[m.key])} g</span>
          </li>
        ))}
      </ul>
      <p className={cx(styles.note, pace?.warn && styles.warn)}>{note}</p>
    </Card>
  );
}
