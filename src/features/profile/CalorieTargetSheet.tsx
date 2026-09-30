import { useState } from "react";
import { saveSettings } from "../../data/store.ts";
import type { Profile, Settings } from "../../data/types.ts";
import { computePlan } from "../../domain/goals.ts";
import { formatNumber, parseNumber } from "../../lib/format.ts";
import { BigInput } from "../../ui/BigInput";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import styles from "./profile.module.css";

interface Props {
  profile: Profile;
  settings: Settings;
  onClose: () => void;
}

const MIN_CALORIES = 800;
const MAX_CALORIES = 6000;

/** Set the calorie goal by hand, or go back to the calculated one. */
export function CalorieTargetSheet({ profile, settings, onClose }: Props) {
  const calculated = computePlan(profile).targets.calories;
  const [text, setText] = useState(String(settings.customCalories ?? calculated));
  const value = parseNumber(text);
  const valid = Number.isFinite(value) && value >= MIN_CALORIES && value <= MAX_CALORIES;

  const save = () => {
    saveSettings({ customCalories: Math.round(value) === calculated ? null : Math.round(value) });
    onClose();
  };
  const useCalculated = () => {
    saveSettings({ customCalories: null });
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Daily calories"
      subtitle="Change it if the calculated number does not suit you"
      footer={
        <>
          {settings.customCalories !== null && <Button size="lg" onClick={useCalculated}>Use {formatNumber(calculated)}</Button>}
          <Button variant="primary" size="lg" block disabled={!valid} onClick={save}>Save</Button>
        </>
      }
    >
      <div className={styles.fieldBody}>
        <BigInput
          label="Calories per day"
          value={text}
          onChange={(v) => setText(v.replace(/\D/g, ""))}
          unit="kcal"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          invalid={!valid}
          hint={valid ? `Calculated for you: ${formatNumber(calculated)} kcal` : `Enter between ${formatNumber(MIN_CALORIES)} and ${formatNumber(MAX_CALORIES)}`}
          onEnter={() => valid && save()}
        />
      </div>
    </Sheet>
  );
}
