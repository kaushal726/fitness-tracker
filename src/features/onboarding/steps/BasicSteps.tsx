import { useState } from "react";
import { PROFILE_LIMITS } from "../../../domain/goals.ts";
import { BigInput } from "../../../ui/BigInput";
import type { StepEditorProps } from "./types.ts";

const hasIssue = ({ issues }: StepEditorProps["controller"], field: string) => issues.some((i) => i.field === field);

export function NameStep({ controller, onCommit }: StepEditorProps) {
  return (
    <BigInput label="Your name" value={controller.form.name} onChange={(name) => controller.set({ name })} placeholder="Your name" autoComplete="given-name" maxLength={40} size="md" autoFocus onEnter={onCommit} />
  );
}

export function AgeStep({ controller, onCommit }: StepEditorProps) {
  const [touched, setTouched] = useState(false);
  const [min, max] = PROFILE_LIMITS.age;
  return (
    <BigInput
      label="Age in years"
      value={controller.form.age}
      onChange={(age) => controller.set({ age: age.replace(/\D/g, "") })}
      unit="years"
      placeholder="30"
      inputMode="numeric"
      maxLength={3}
      autoFocus
      invalid={touched && hasIssue(controller, "age")}
      hint={`Between ${min} and ${max}`}
      onBlur={() => setTouched(true)}
      onEnter={onCommit}
    />
  );
}

export function WeightStep({ controller, onCommit }: StepEditorProps) {
  const [touched, setTouched] = useState(false);
  const [min, max] = PROFILE_LIMITS.weightKg;
  return (
    <BigInput
      label="Weight in kilograms"
      value={controller.form.weightKg}
      onChange={(weightKg) => controller.set({ weightKg })}
      unit="kg"
      placeholder="70"
      inputMode="decimal"
      maxLength={5}
      autoFocus
      invalid={touched && hasIssue(controller, "weightKg")}
      hint={`Between ${min} and ${max} kg`}
      onBlur={() => setTouched(true)}
      onEnter={onCommit}
    />
  );
}
