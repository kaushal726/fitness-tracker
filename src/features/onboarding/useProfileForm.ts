import { useCallback, useMemo, useState } from "react";
import type { ActivityId, Gender, GoalId, Profile } from "../../data/types.ts";
import { computePlan, goalDef, profileIssues, type Plan, type ProfileIssue } from "../../domain/goals.ts";
import { cmFromFeetInches, feetInchesFromCm, type HeightUnit } from "../../domain/height.ts";
import { DEFAULT_TIMELINE, fromWeeks, toWeeks, type TimelineUnit } from "../../domain/timeline.ts";
import { parseNumber } from "../../lib/format.ts";

/** What is on screen, as typed. Numbers stay text until they are checked. */
export interface FormState {
  name: string;
  gender: Gender | null;
  age: string;
  heightUnit: HeightUnit;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  goal: GoalId | null;
  targetWeightKg: string;
  timelineUnit: TimelineUnit;
  timelineValue: string;
  activity: ActivityId | null;
}

export interface Answers {
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number | null;
  weeks: number | null;
}

/** Assumed only for the pace preview, until the person answers how active they are. */
const PREVIEW_ACTIVITY: ActivityId = "light";

const text = (n: number) => String(Math.round(n * 10) / 10);

function initialState(profile?: Profile): FormState {
  const feetInches = profile ? feetInchesFromCm(profile.heightCm) : null;
  const timeline = profile?.weeks ? fromWeeks(profile.weeks) : DEFAULT_TIMELINE;
  return {
    name: profile?.name ?? "",
    gender: profile?.gender ?? null,
    age: profile ? String(profile.age) : "",
    heightUnit: "cm",
    heightCm: profile ? text(profile.heightCm) : "",
    heightFt: feetInches ? String(feetInches.feet) : "",
    heightIn: feetInches ? String(feetInches.inches) : "",
    weightKg: profile ? text(profile.weightKg) : "",
    goal: profile?.goal ?? null,
    targetWeightKg: profile?.targetWeightKg ? text(profile.targetWeightKg) : "",
    timelineUnit: timeline.unit,
    timelineValue: String(timeline.value),
    activity: profile?.activity ?? null,
  };
}

/** True for goals that move the scale, which are the ones that need a target and a timeline. */
export function changesWeight(form: Pick<FormState, "goal">): boolean {
  return form.goal !== null && goalDef(form.goal).direction !== 0;
}

export function parseAnswers(form: FormState): Answers {
  const changes = changesWeight(form);
  const inches = form.heightIn.trim() === "" ? 0 : parseNumber(form.heightIn);
  return {
    age: parseNumber(form.age),
    heightCm: form.heightUnit === "cm" ? parseNumber(form.heightCm) : cmFromFeetInches(parseNumber(form.heightFt), inches),
    weightKg: parseNumber(form.weightKg),
    targetWeightKg: changes && form.targetWeightKg.trim() !== "" ? parseNumber(form.targetWeightKg) : null,
    weeks: changes ? toWeeks(parseNumber(form.timelineValue), form.timelineUnit) : null,
  };
}

export interface ProfileFormController {
  form: FormState;
  set: (patch: Partial<FormState>) => void;
  answers: Answers;
  /** Problems with the numbers so far, by field. Missing choices are not listed here. */
  issues: ProfileIssue[];
  /** The finished profile, or null while anything is missing or out of range. */
  profile: Profile | null;
  plan: Plan | null;
  /**
   * The plan as far as it can be known before the last question: activity assumed light. It lets the
   * timeline step say how fast a pace is while there is still a question to go.
   */
  previewPlan: Plan | null;
}

export function useProfileForm(initial?: Profile): ProfileFormController {
  const [form, setForm] = useState<FormState>(() => initialState(initial));
  const set = useCallback((patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch })), []);

  return useMemo(() => {
    const answers = parseAnswers(form);
    const issues = profileIssues({ ...answers, goal: form.goal ?? "maintain" });
    if (issues.length || form.gender === null || form.goal === null) return { form, set, answers, issues, profile: null, plan: null, previewPlan: null };
    const { gender, goal } = form;
    const build = (activity: ActivityId): Profile => ({
      name: form.name.trim(),
      age: answers.age,
      gender,
      heightCm: Math.round(answers.heightCm * 10) / 10,
      weightKg: answers.weightKg,
      goal,
      targetWeightKg: answers.targetWeightKg,
      weeks: answers.weeks,
      activity,
    });
    const previewPlan = computePlan(build(PREVIEW_ACTIVITY));
    if (form.activity === null) return { form, set, answers, issues, profile: null, plan: null, previewPlan };
    const profile = build(form.activity);
    return { form, set, answers, issues, profile, plan: computePlan(profile), previewPlan };
  }, [form, set]);
}
