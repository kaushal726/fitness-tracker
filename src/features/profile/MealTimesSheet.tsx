import { useState } from "react";
import { saveSettings } from "../../data/store.ts";
import type { Settings } from "../../data/types.ts";
import { DEFAULT_MEAL_STARTS, formatHour, isValidMealStarts, MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import { Button } from "../../ui/Button";
import { Field } from "../../ui/Field";
import { Sheet } from "../../ui/Sheet";
import styles from "./profile.module.css";

interface Props {
  settings: Settings;
  onClose: () => void;
}

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i / 2);

/** When each meal starts. New food goes under the latest meal that has started. */
export function MealTimesSheet({ settings, onClose }: Props) {
  const [starts, setStarts] = useState(settings.mealStartHours);
  const valid = isValidMealStarts(starts);

  return (
    <Sheet
      open
      onClose={onClose}
      title="Meal times"
      subtitle="Food goes under the latest meal that has started"
      footer={
        <>
          <Button size="lg" onClick={() => setStarts(DEFAULT_MEAL_STARTS)}>Reset</Button>
          <Button variant="primary" size="lg" block disabled={!valid} onClick={() => { saveSettings({ mealStartHours: starts }); onClose(); }}>Save</Button>
        </>
      }
    >
      {MEAL_ORDER.map((meal) => (
        <Field key={meal} label={`${MEAL_LABELS[meal]} starts at`} htmlFor={`start-${meal}`}>
          <select id={`start-${meal}`} className={styles.select} value={starts[meal]} onChange={(e) => setStarts({ ...starts, [meal]: Number(e.target.value) })}>
            {HALF_HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
          </select>
        </Field>
      ))}
      {!valid && <p className={styles.error}>Each meal should start later than the one before it.</p>}
    </Sheet>
  );
}
