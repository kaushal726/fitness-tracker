import { useState } from "react";
import { saveSettings } from "../../data/store.ts";
import type { Settings } from "../../data/types.ts";
import { DEFAULT_MEAL_STARTS, formatHour, isValidMealStarts, MEAL_LABELS, MEAL_ORDER, MEAL_START_STEP } from "../../domain/meals.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Field } from "../../ui/Field";
import { Sheet } from "../../ui/Sheet";
import { Stepper } from "../../ui/Stepper";
import styles from "./profile.module.css";

interface Props {
  settings: Settings;
  onClose: () => void;
}

const FIRST_START = 0;
const LAST_START = 24 - MEAL_START_STEP;

/** When each meal starts. New food goes under the latest meal that has started. A meal can only move up to the ones around it. */
export function MealTimesSheet({ settings, onClose }: Props) {
  const [starts, setStarts] = useState(settings.mealStartHours);
  const valid = isValidMealStarts(starts);
  const move = (meal: MealType, by: number) => setStarts({ ...starts, [meal]: starts[meal] + by });

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
      {MEAL_ORDER.map((meal, i) => {
        const earliest = i === 0 ? FIRST_START : starts[MEAL_ORDER[i - 1]] + MEAL_START_STEP;
        const latest = i === MEAL_ORDER.length - 1 ? LAST_START : starts[MEAL_ORDER[i + 1]] - MEAL_START_STEP;
        const label = `${MEAL_LABELS[meal]} starts at`;
        return (
          <Field key={meal} label={label}>
            <Stepper
              label={label}
              value={formatHour(starts[meal])}
              compact
              lessDisabled={starts[meal] <= earliest}
              moreDisabled={starts[meal] >= latest}
              onLess={() => move(meal, -MEAL_START_STEP)}
              onMore={() => move(meal, MEAL_START_STEP)}
            />
          </Field>
        );
      })}
      {!valid && <p className={styles.error}>Each meal should start later than the one before it.</p>}
    </Sheet>
  );
}
