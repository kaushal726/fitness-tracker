import type { FormState } from "./useProfileForm.ts";
import { activeSteps } from "./steps/registry.tsx";
import type { StepId } from "./steps/types.ts";

/** The steps of the first-run setup: every question that applies, then the finished plan. */
export type WizardStep = StepId | "plan";

export function stepOrder(form: FormState): WizardStep[] {
  return [...activeSteps(form).map((s) => s.id), "plan"];
}

export function nextStep(form: FormState, current: WizardStep): WizardStep | null {
  const order = stepOrder(form);
  const i = order.indexOf(current);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

export function previousStep(form: FormState, current: WizardStep): WizardStep | null {
  const order = stepOrder(form);
  const i = order.indexOf(current);
  return i > 0 ? order[i - 1] : null;
}

/** How far along the setup is, as 0-1, counting the finished plan as the last step. */
export function progressOf(form: FormState, current: WizardStep): number {
  const order = stepOrder(form);
  return (Math.max(0, order.indexOf(current)) + 1) / order.length;
}
