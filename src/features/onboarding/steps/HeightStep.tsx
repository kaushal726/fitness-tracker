import { useState } from "react";
import { PROFILE_LIMITS } from "../../../domain/goals.ts";
import { cmFromFeetInches, feetInchesFromCm, type HeightUnit } from "../../../domain/height.ts";
import { parseNumber } from "../../../lib/format.ts";
import { BigInput } from "../../../ui/BigInput";
import { Segmented } from "../../../ui/Segmented";
import type { StepEditorProps } from "./types.ts";
import styles from "./steps.module.css";

const UNITS: { value: HeightUnit; label: string }[] = [
  { value: "cm", label: "cm" },
  { value: "ft", label: "ft & in" },
];

const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** Height in centimetres, or in feet and inches for people who think that way. Switching keeps the same height. */
export function HeightStep({ controller, onCommit }: StepEditorProps) {
  const { form, set, issues } = controller;
  const [touched, setTouched] = useState(false);
  const [min, max] = PROFILE_LIMITS.heightCm;
  const invalid = touched && issues.some((i) => i.field === "heightCm");

  const switchUnit = (unit: HeightUnit) => {
    if (unit === form.heightUnit) return;
    if (unit === "ft") {
      const cm = parseNumber(form.heightCm);
      const fi = Number.isFinite(cm) ? feetInchesFromCm(cm) : null;
      set({ heightUnit: unit, heightFt: fi ? String(fi.feet) : "", heightIn: fi ? String(fi.inches) : "" });
    } else {
      const inches = form.heightIn.trim() === "" ? 0 : parseNumber(form.heightIn);
      const cm = cmFromFeetInches(parseNumber(form.heightFt), inches);
      set({ heightUnit: unit, heightCm: Number.isFinite(cm) ? String(Math.round(cm)) : "" });
    }
  };

  return (
    <div className={styles.stack}>
      <Segmented label="Height unit" value={form.heightUnit} onChange={switchUnit} options={UNITS} />
      {form.heightUnit === "cm" ? (
        <BigInput
          label="Height in centimetres"
          value={form.heightCm}
          onChange={(heightCm) => set({ heightCm })}
          unit="cm"
          placeholder="170"
          inputMode="decimal"
          maxLength={5}
          autoFocus
          invalid={invalid}
          hint={`Between ${min} and ${max} cm`}
          onBlur={() => setTouched(true)}
          onEnter={onCommit}
        />
      ) : (
        <div className={styles.pair}>
          <BigInput label="Feet" value={form.heightFt} onChange={(v) => set({ heightFt: digitsOnly(v) })} unit="ft" placeholder="5" inputMode="numeric" maxLength={1} autoFocus invalid={invalid} onBlur={() => setTouched(true)} onEnter={onCommit} />
          <BigInput label="Inches" value={form.heightIn} onChange={(v) => set({ heightIn: v.replace(/[^\d.]/g, "") })} unit="in" placeholder="7" inputMode="decimal" maxLength={4} invalid={invalid} onBlur={() => setTouched(true)} onEnter={onCommit} />
        </div>
      )}
    </div>
  );
}
