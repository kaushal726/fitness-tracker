import { goalDef, ACTIVITY_LEVELS } from "../../../domain/goals.ts";
import { formatHeight } from "../../../domain/height.ts";
import { formatTimeline } from "../../../domain/timeline.ts";
import { IconActivity, IconAge, IconFlag, IconRuler, IconScale, IconTarget, IconTimeline, IconUser } from "../../../ui/icons";
import { changesWeight, type ProfileFormController } from "../useProfileForm.ts";
import { AgeStep, NameStep, WeightStep } from "./BasicSteps.tsx";
import { ActivityStep, GenderStep, GoalStep } from "./ChoiceSteps.tsx";
import { HeightStep } from "./HeightStep.tsx";
import { TargetStep, TimelineStep } from "./TargetSteps.tsx";
import type { StepDef, StepId } from "./types.ts";

const noIssue = (c: ProfileFormController, field: string) => !c.issues.some((i) => i.field === field);
const kg = (n: number) => `${Math.round(n * 10) / 10} kg`;

/** Every question, in the order they are asked. */
export const STEPS: StepDef[] = [
  {
    id: "name",
    title: "What should we call you?",
    label: "Name",
    helper: "Just your first name is fine.",
    icon: <IconUser />,
    Editor: NameStep,
    isActive: () => true,
    isValid: () => true,
    summary: (c) => c.form.name.trim() || "Not set",
  },
  {
    id: "gender",
    title: "Are you male or female?",
    label: "Gender",
    helper: "It helps us estimate how much energy your body uses.",
    icon: <IconUser />,
    Editor: GenderStep,
    isActive: () => true,
    isValid: (c) => c.form.gender !== null,
    summary: (c) => (c.form.gender === "female" ? "Female" : c.form.gender === "male" ? "Male" : "Not set"),
  },
  {
    id: "age",
    title: "How old are you?",
    label: "Age",
    icon: <IconAge />,
    Editor: AgeStep,
    isActive: () => true,
    isValid: (c) => noIssue(c, "age"),
    summary: (c) => (Number.isFinite(c.answers.age) ? `${c.answers.age} years` : "Not set"),
  },
  {
    id: "height",
    title: "How tall are you?",
    label: "Height",
    icon: <IconRuler />,
    Editor: HeightStep,
    isActive: () => true,
    isValid: (c) => noIssue(c, "heightCm"),
    summary: (c) => (Number.isFinite(c.answers.heightCm) ? formatHeight(c.answers.heightCm, c.form.heightUnit) : "Not set"),
  },
  {
    id: "weight",
    title: "What do you weigh right now?",
    label: "Weight",
    helper: "Your best guess is fine.",
    icon: <IconScale />,
    Editor: WeightStep,
    isActive: () => true,
    isValid: (c) => noIssue(c, "weightKg"),
    summary: (c) => (Number.isFinite(c.answers.weightKg) ? kg(c.answers.weightKg) : "Not set"),
  },
  {
    id: "goal",
    title: "What is your goal?",
    label: "Goal",
    helper: "We set your daily calories to match.",
    icon: <IconTarget />,
    Editor: GoalStep,
    isActive: () => true,
    isValid: (c) => c.form.goal !== null,
    summary: (c) => (c.form.goal ? goalDef(c.form.goal).label : "Not set"),
  },
  {
    id: "target",
    title: "What weight do you want to reach?",
    label: "Target weight",
    icon: <IconFlag />,
    Editor: TargetStep,
    isActive: changesWeight,
    isValid: (c) => noIssue(c, "targetWeightKg") && c.answers.targetWeightKg !== null,
    summary: (c) => (c.answers.targetWeightKg !== null ? kg(c.answers.targetWeightKg) : "Not set"),
  },
  {
    id: "timeline",
    title: "How long do you want to take?",
    label: "Timeline",
    helper: "A steady pace is easier to keep up.",
    icon: <IconTimeline />,
    Editor: TimelineStep,
    isActive: changesWeight,
    isValid: (c) => noIssue(c, "weeks"),
    summary: (c) => (c.answers.weeks !== null && Number.isFinite(c.answers.weeks) ? formatTimeline(c.answers.weeks) : "Not set"),
  },
  {
    id: "activity",
    title: "How active are you?",
    label: "Activity",
    helper: "Think about a normal week.",
    icon: <IconActivity />,
    Editor: ActivityStep,
    isActive: () => true,
    isValid: (c) => c.form.activity !== null,
    summary: (c) => ACTIVITY_LEVELS.find((a) => a.id === c.form.activity)?.label ?? "Not set",
  },
];

export function stepById(id: StepId): StepDef {
  return STEPS.find((s) => s.id === id) ?? STEPS[0];
}

export function activeSteps(form: ProfileFormController["form"]): StepDef[] {
  return STEPS.filter((s) => s.isActive(form));
}
