import { useEffect, useState } from "react";
import { saveProfile, saveSettings } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { SettingsGroup, SettingsRow } from "../../ui/SettingsList";
import { Sheet } from "../../ui/Sheet";
import { useToast } from "../../ui/Toast";
import { PlanPreview } from "../onboarding/PlanPreview.tsx";
import { activeSteps, stepById } from "../onboarding/steps/registry.tsx";
import type { StepId } from "../onboarding/steps/types.ts";
import { useProfileForm } from "../onboarding/useProfileForm.ts";
import styles from "./profile.module.css";

interface Props {
  profile: Profile;
  onClose: () => void;
}

/**
 * Every answer in one list, with today's values. Tapping one opens just that question, so changing
 * a weight is two taps and a number, not the whole setup again. Saving recalculates the target.
 */
export function EditProfileSheet({ profile, onClose }: Props) {
  const controller = useProfileForm(profile);
  const [editing, setEditing] = useState<StepId | null>(null);
  const [checkTarget, setCheckTarget] = useState(false);
  const toast = useToast();
  const steps = activeSteps(controller.form);

  const closeField = () => {
    const closing = editing;
    setEditing(null);
    if (closing === "goal") setCheckTarget(true);
  };

  // A new goal that moves the scale needs a target weight: ask for it straight away.
  useEffect(() => {
    if (!checkTarget || editing !== null) return;
    setCheckTarget(false);
    const target = stepById("target");
    if (target.isActive(controller.form) && !target.isValid(controller)) setEditing("target");
  }, [checkTarget, editing, controller]);

  const save = () => {
    if (!controller.profile) return;
    saveProfile(controller.profile);
    saveSettings({ customCalories: null });
    toast("Goal updated");
    onClose();
  };

  const field = editing ? stepById(editing) : null;

  return (
    <>
      <Sheet open onClose={onClose} title="Goal and body" size="full" footer={<Button variant="primary" size="lg" block disabled={!controller.profile} onClick={save}>Save changes</Button>}>
        {controller.plan ? (
          <PlanPreview plan={controller.plan} requestedWeeks={controller.answers.weeks} />
        ) : (
          <Card><p className={styles.hintCard}>Fix the highlighted answers to see your plan.</p></Card>
        )}
        <SettingsGroup label="Your answers">
          {steps.map((def) => (
            <SettingsRow key={def.id} icon={def.icon} tone="green" title={def.label} value={def.summary(controller)} invalid={!def.isValid(controller)} onClick={() => setEditing(def.id)} />
          ))}
        </SettingsGroup>
      </Sheet>

      {field && (
        <Sheet
          open
          onClose={closeField}
          title={field.label}
          subtitle={field.helper}
          footer={<Button variant="primary" size="lg" block disabled={!field.isValid(controller)} onClick={closeField}>Done</Button>}
        >
          <div className={styles.fieldBody}>
            <field.Editor controller={controller} onCommit={() => field.isValid(controller) && closeField()} />
          </div>
        </Sheet>
      )}
    </>
  );
}
