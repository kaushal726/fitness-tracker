import { useState } from "react";
import { saveProfile } from "../../data/store.ts";
import { isInstantArrival } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconBack, IconSparkles } from "../../ui/icons";
import { ProgressBar } from "../../ui/ProgressBar";
import { BrandPanel } from "./BrandPanel.tsx";
import { nextStep, previousStep, progressOf, type WizardStep } from "./flow.ts";
import { PlanPreview } from "./PlanPreview.tsx";
import { stepById } from "./steps/registry.tsx";
import { StepScreen } from "./StepScreen.tsx";
import { useProfileForm } from "./useProfileForm.ts";
import styles from "./wizard.module.css";

/** First run: one question at a time, then the finished plan. */
export function Onboarding() {
  const controller = useProfileForm();
  const { form } = controller;
  const [current, setCurrent] = useState<WizardStep>("name");
  /** Which way the step slides in. Null, on a reloaded page, until the first move: that first step just appears. */
  const [direction, setDirection] = useState<"forward" | "back" | null>(() => (isInstantArrival() ? null : "forward"));

  const def = current === "plan" ? null : stepById(current);
  const valid = def ? def.isValid(controller) : controller.profile !== null;
  const previous = previousStep(form, current);
  const name = form.name.trim();

  const advance = () => {
    if (!def) {
      if (controller.profile) saveProfile(controller.profile);
      return;
    }
    if (!def.isValid(controller)) return;
    setDirection("forward");
    setCurrent(nextStep(form, current) ?? "plan");
  };

  const back = () => {
    if (!previous) return;
    setDirection("back");
    setCurrent(previous);
  };

  const buttonLabel = !def ? "Start tracking" : def.id === "name" && !name ? "Skip" : "Continue";

  return (
    <div className={styles.shell}>
      <BrandPanel />
      <div className={styles.page}>
      <header className={styles.top}>
        {previous ? <IconButton label="Back" icon={<IconBack />} onClick={back} /> : <span className={styles.spacer} />}
        <div className={styles.progress}>
          <ProgressBar value={progressOf(form, current)} max={1} size="sm" label="Setup progress" />
        </div>
        <span className={styles.spacer} />
      </header>

      <main className={styles.body}>
        <section key={current} className={cx(styles.step, direction && (direction === "back" ? styles.fromLeft : styles.fromRight))}>
          {def ? (
            <StepScreen def={def} controller={controller} onCommit={advance} />
          ) : (
            <>
              <span className={styles.tile} aria-hidden><IconSparkles /></span>
              <h1 className={styles.title}>{name ? `Your plan, ${name}` : "Your daily plan"}</h1>
              <p className={styles.helper}>Built from what you told us. You can change it any time in Profile.</p>
              {controller.plan && <PlanPreview plan={controller.plan} requestedWeeks={controller.answers.weeks} reveal />}
            </>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <Button variant="primary" size="lg" block disabled={!valid} onClick={advance}>{buttonLabel}</Button>
      </footer>
      </div>
    </div>
  );
}
