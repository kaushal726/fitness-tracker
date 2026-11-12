import { useState } from "react";
import { reminderSupport, syncReminders, type ReminderSupport } from "../../app/reminderPush.ts";
import { saveSettings } from "../../data/store.ts";
import type { Settings } from "../../data/types.ts";
import { formatHour, MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import { clampReminder, REMINDER_STEP, reminderPlan, WATER_INTERVALS, waterReminderHours, type WaterReminders } from "../../domain/reminders.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { Field } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";
import { Stepper } from "../../ui/Stepper";
import { Switch } from "../../ui/Switch";
import { useToast } from "../../ui/Toast";
import styles from "./profile.module.css";

interface Props {
  settings: Settings;
  onClose: () => void;
}

/** Why reminders cannot be turned on here, in a line the person can act on. */
const NOT_READY: Record<Exclude<ReminderSupport, "ready">, string> = {
  "not-set-up": "Reminders are not set up for this app yet.",
  "install-first": "On an iPhone, add the app to your Home Screen first (Share, then Add to Home Screen), and open it from there.",
  unsupported: "This browser cannot show reminders.",
  blocked: "Notifications are blocked for this app. Allow them in your phone's settings, then come back.",
};

const INTERVAL_OPTIONS = WATER_INTERVALS.map((h) => ({ value: String(h), label: h === 1 ? "1 hour" : `${h} hours` }));

/** A reminder to log each meal, and to drink water through the day. Saving sends only the minutes to the reminder server. */
export function RemindersSheet({ settings, onClose }: Props) {
  const toast = useToast();
  const [meals, setMeals] = useState(settings.reminders);
  const [water, setWater] = useState(settings.waterReminders);
  const [busy, setBusy] = useState(false);
  const support = reminderSupport();
  const ready = support === "ready";
  const moveMeal = (meal: MealType, by: number) => setMeals({ ...meals, times: { ...meals.times, [meal]: clampReminder(meals.times[meal] + by) } });
  const setWaterPart = (patch: Partial<WaterReminders>) => setWater({ ...water, ...patch });
  const waterCount = waterReminderHours(water).length;

  const save = async () => {
    setBusy(true);
    try {
      await syncReminders(reminderPlan(meals, water));
      saveSettings({ reminders: meals, waterReminders: water });
      toast(meals.enabled || water.enabled ? "Reminders saved" : "Reminders are off");
      onClose();
    } catch {
      toast("Reminders could not be saved. Check notifications are allowed and you are online.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Reminders"
      subtitle="Notifications to log your meals and drink water"
      footer={ready ? <Button variant="primary" size="lg" block disabled={busy} onClick={save}>Save</Button> : undefined}
    >
      {!ready && <p className={styles.hintCard}>{NOT_READY[support]}</p>}

      <section className={styles.reminderGroup} aria-label="Meal reminders">
        <Switch label="Meals" hint="A nudge to log each meal" checked={meals.enabled} disabled={!ready} onChange={(enabled) => setMeals({ ...meals, enabled })} />
        {meals.enabled &&
          MEAL_ORDER.map((meal) => {
            const label = `${MEAL_LABELS[meal]} reminder`;
            return (
              <Field key={meal} label={MEAL_LABELS[meal]}>
                <Stepper label={label} value={formatHour(meals.times[meal])} compact onLess={() => moveMeal(meal, -REMINDER_STEP)} onMore={() => moveMeal(meal, REMINDER_STEP)} />
              </Field>
            );
          })}
      </section>

      <section className={styles.reminderGroup} aria-label="Water reminders">
        <Switch label="Water" hint={water.enabled ? `${waterCount} ${waterCount === 1 ? "reminder" : "reminders"} a day` : "A nudge to drink through the day"} checked={water.enabled} disabled={!ready} onChange={(enabled) => setWaterPart({ enabled })} />
        {water.enabled && (
          <>
            <Field label="Every">
              <Segmented label="Time between water reminders" value={String(water.everyHours)} onChange={(v) => setWaterPart({ everyHours: Number(v) })} options={INTERVAL_OPTIONS} />
            </Field>
            <Field label="First one">
              <Stepper
                label="First water reminder"
                value={formatHour(water.from)}
                compact
                lessDisabled={water.from <= 0}
                moreDisabled={water.from >= water.to}
                onLess={() => setWaterPart({ from: clampReminder(water.from - REMINDER_STEP) })}
                onMore={() => setWaterPart({ from: clampReminder(water.from + REMINDER_STEP) })}
              />
            </Field>
            <Field label="Last one">
              <Stepper
                label="Last water reminder"
                value={formatHour(water.to)}
                compact
                lessDisabled={water.to <= water.from}
                moreDisabled={water.to >= 24 - REMINDER_STEP}
                onLess={() => setWaterPart({ to: clampReminder(water.to - REMINDER_STEP) })}
                onMore={() => setWaterPart({ to: clampReminder(water.to + REMINDER_STEP) })}
              />
            </Field>
          </>
        )}
      </section>

      <p className={styles.note}>Only the times and your time zone go to the reminder server. What you eat and drink stays on this phone.</p>
    </Sheet>
  );
}
