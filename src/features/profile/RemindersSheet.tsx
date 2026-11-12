import { useState } from "react";
import { reminderSupport, sendTestReminder, startReminders, stopReminders, type ReminderSupport } from "../../app/reminderPush.ts";
import { saveSettings } from "../../data/store.ts";
import type { Settings } from "../../data/types.ts";
import { formatHour, MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import { clampReminder, REMINDER_STEP } from "../../domain/reminders.ts";
import type { MealType } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { IconBell } from "../../ui/icons";
import { Field } from "../../ui/Field";
import { Sheet } from "../../ui/Sheet";
import { Stepper } from "../../ui/Stepper";
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

/** A reminder to log each meal, at a time of your choosing. Saving sends only the times to the reminder server. */
export function RemindersSheet({ settings, onClose }: Props) {
  const toast = useToast();
  const [times, setTimes] = useState(settings.reminders.times);
  const [busy, setBusy] = useState(false);
  const support = reminderSupport();
  const on = settings.reminders.enabled;
  const move = (meal: MealType, by: number) => setTimes({ ...times, [meal]: clampReminder(times[meal] + by) });

  const turnOn = async () => {
    setBusy(true);
    try {
      await startReminders(times);
      saveSettings({ reminders: { enabled: true, times } });
      toast("Reminders are on");
      onClose();
    } catch {
      toast("Reminders could not be turned on. Check notifications are allowed and you are online.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await stopReminders().catch(() => undefined);
    saveSettings({ reminders: { enabled: false, times } });
    setBusy(false);
    toast("Reminders are off");
    onClose();
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      await sendTestReminder();
      toast("Test sent. It should arrive in a few seconds.");
    } catch {
      toast("The test could not be sent. Turn reminders off and on again, then try once more.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Meal reminders"
      subtitle="A notification to log each meal"
      footer={
        support !== "ready" ? undefined : on ? (
          <>
            <Button size="lg" disabled={busy} onClick={turnOff}>Turn off</Button>
            <Button variant="primary" size="lg" block disabled={busy} onClick={turnOn}>Save times</Button>
          </>
        ) : (
          <Button variant="primary" size="lg" block disabled={busy} onClick={turnOn}>Turn on reminders</Button>
        )
      }
    >
      {support !== "ready" && <p className={styles.hintCard}>{NOT_READY[support]}</p>}
      {MEAL_ORDER.map((meal) => {
        const label = `${MEAL_LABELS[meal]} reminder`;
        return (
          <Field key={meal} label={label}>
            <Stepper label={label} value={formatHour(times[meal])} compact onLess={() => move(meal, -REMINDER_STEP)} onMore={() => move(meal, REMINDER_STEP)} />
          </Field>
        );
      })}
      {support === "ready" && on && (
        <Button variant="ghost" size="md" block icon={<IconBell />} disabled={busy} onClick={sendTest}>Send a test notification</Button>
      )}
      <p className={styles.note}>Only these times and your time zone go to the reminder server. What you eat stays on this phone.</p>
    </Sheet>
  );
}
