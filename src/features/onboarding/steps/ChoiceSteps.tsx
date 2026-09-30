import type { ActivityId, Gender, GoalId } from "../../../data/types.ts";
import { ACTIVITY_LEVELS, GOALS } from "../../../domain/goals.ts";
import { ChoiceList, type Choice } from "../../../ui/ChoiceList";
import { IconAthlete, IconCycling, IconFlame, IconMaintain, IconMuscle, IconSitting, IconTrendDown, IconTrendUp, IconWalking } from "../../../ui/icons";
import { useCommitSoon } from "../useCommitSoon.ts";
import type { StepEditorProps } from "./types.ts";

const GENDERS: Choice<Gender>[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const GOAL_ICONS: Record<GoalId, Choice<GoalId>["icon"]> = {
  lose_fat: <IconFlame />,
  lose_weight: <IconTrendDown />,
  maintain: <IconMaintain />,
  gain_muscle: <IconMuscle />,
  gain_weight: <IconTrendUp />,
};

const ACTIVITY_ICONS: Record<ActivityId, Choice<ActivityId>["icon"]> = {
  sedentary: <IconSitting />,
  light: <IconWalking />,
  moderate: <IconCycling />,
  active: <IconMuscle />,
  athlete: <IconAthlete />,
};

const GOAL_CHOICES: Choice<GoalId>[] = GOALS.map((g) => ({ value: g.id, label: g.label, hint: g.hint, icon: GOAL_ICONS[g.id] }));
const ACTIVITY_CHOICES: Choice<ActivityId>[] = ACTIVITY_LEVELS.map((a) => ({ value: a.id, label: a.label, hint: a.hint, icon: ACTIVITY_ICONS[a.id] }));

export function GenderStep({ controller, onCommit }: StepEditorProps) {
  const commitSoon = useCommitSoon(onCommit);
  return <ChoiceList label="Gender" choices={GENDERS} value={controller.form.gender} onChange={(gender) => { controller.set({ gender }); commitSoon(); }} />;
}

export function GoalStep({ controller, onCommit }: StepEditorProps) {
  const commitSoon = useCommitSoon(onCommit);
  return <ChoiceList label="Goal" choices={GOAL_CHOICES} value={controller.form.goal} onChange={(goal) => { controller.set({ goal }); commitSoon(); }} />;
}

export function ActivityStep({ controller, onCommit }: StepEditorProps) {
  const commitSoon = useCommitSoon(onCommit);
  return <ChoiceList label="Activity level" choices={ACTIVITY_CHOICES} value={controller.form.activity} onChange={(activity) => { controller.set({ activity }); commitSoon(); }} />;
}
