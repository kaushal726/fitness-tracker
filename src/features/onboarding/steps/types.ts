import type { ReactNode } from "react";
import type { FormState, ProfileFormController } from "../useProfileForm.ts";

export type StepId = "name" | "gender" | "age" | "height" | "weight" | "goal" | "target" | "timeline" | "activity";

export interface StepEditorProps {
  controller: ProfileFormController;
  /** Called when the person is done with this step: Enter in a field, or a one-tap choice. */
  onCommit: () => void;
}

export interface StepDef {
  id: StepId;
  /** The question, shown large in the setup. */
  title: string;
  /** A short name, for lists. */
  label: string;
  helper?: string;
  icon: ReactNode;
  Editor: (props: StepEditorProps) => ReactNode;
  /** Some steps only apply to some goals. */
  isActive: (form: FormState) => boolean;
  isValid: (controller: ProfileFormController) => boolean;
  /** The current answer in words, for the review list. */
  summary: (controller: ProfileFormController) => string;
}
