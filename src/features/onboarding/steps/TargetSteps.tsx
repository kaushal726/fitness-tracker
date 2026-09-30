import { useState } from "react";
import { goalDef } from "../../../domain/goals.ts";
import { TIMELINE_PRESETS, TIMELINE_UNITS, toWeeks, weeksToUnit, type TimelineUnit } from "../../../domain/timeline.ts";
import { formatNumber, parseNumber } from "../../../lib/format.ts";
import { BigInput } from "../../../ui/BigInput";
import { Chip } from "../../../ui/Chip";
import { Segmented } from "../../../ui/Segmented";
import { cx } from "../../../lib/cx.ts";
import { paceSentence } from "../pace.ts";
import type { StepEditorProps } from "./types.ts";
import styles from "./steps.module.css";

const DEFAULT_STEP_KG = 5;

export function TargetStep({ controller, onCommit }: StepEditorProps) {
  const { form, answers, issues, set } = controller;
  const [touched, setTouched] = useState(false);
  const issue = issues.find((i) => i.field === "targetWeightKg");
  const direction = form.goal ? goalDef(form.goal).direction : 0;
  const suggestion = Number.isFinite(answers.weightKg) ? Math.round(answers.weightKg + direction * DEFAULT_STEP_KG) : undefined;
  const change = answers.targetWeightKg !== null && Number.isFinite(answers.weightKg) ? answers.targetWeightKg - answers.weightKg : null;

  return (
    <div className={styles.stack}>
      <BigInput
        label="Target weight in kilograms"
        value={form.targetWeightKg}
        onChange={(targetWeightKg) => set({ targetWeightKg })}
        unit="kg"
        placeholder={suggestion === undefined ? "65" : String(suggestion)}
        inputMode="decimal"
        maxLength={5}
        autoFocus
        invalid={touched && issue !== undefined}
        hint={touched && issue ? issue.message : `You are ${Number.isFinite(answers.weightKg) ? formatNumber(answers.weightKg) : "…"} kg now`}
        onBlur={() => setTouched(true)}
        onEnter={onCommit}
      />
      {change !== null && !issue && change !== 0 && (
        <span className={styles.delta}>{change > 0 ? "+" : "−"}{Math.abs(Math.round(change * 10) / 10)} kg from now</span>
      )}
    </div>
  );
}

/** Any length of time, in days, weeks or months, with quick picks. Nobody is limited to a fixed list. */
export function TimelineStep({ controller, onCommit }: StepEditorProps) {
  const { form, set, previewPlan } = controller;
  const [touched, setTouched] = useState(false);
  const unit = form.timelineUnit;
  const value = parseNumber(form.timelineValue);
  const invalid = touched && controller.issues.some((i) => i.field === "weeks");
  const pace = previewPlan ? paceSentence(previewPlan, controller.answers.weeks) : null;

  const changeUnit = (next: TimelineUnit) => {
    if (next === unit) return;
    const weeks = toWeeks(value, unit);
    set({ timelineUnit: next, timelineValue: Number.isFinite(weeks) && weeks > 0 ? String(weeksToUnit(weeks, next)) : form.timelineValue });
  };

  return (
    <div className={styles.stack}>
      <Segmented label="Timeline unit" value={unit} onChange={changeUnit} options={TIMELINE_UNITS} />
      <BigInput
        label={`Number of ${unit}`}
        value={form.timelineValue}
        onChange={(timelineValue) => set({ timelineValue: timelineValue.replace(/\D/g, "") })}
        unit={unit}
        placeholder="12"
        inputMode="numeric"
        maxLength={4}
        autoFocus
        invalid={invalid}
        hint={invalid ? "Enter a length of time between a week and five years" : "Type any number, or pick one below"}
        onBlur={() => setTouched(true)}
        onEnter={onCommit}
      />
      <div className={cx("scroll-row", styles.presets)}>
        {TIMELINE_PRESETS[unit].map((n) => (
          <Chip key={n} role="radio" selected={value === n} onClick={() => set({ timelineValue: String(n) })}>{n} {unit}</Chip>
        ))}
      </div>
      {pace && <p className={cx(styles.note, pace.warn && styles.noteWarn)}>{pace.text}</p>}
    </div>
  );
}
