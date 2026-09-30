import type { StepDef } from "./steps/types.ts";
import type { ProfileFormController } from "./useProfileForm.ts";
import styles from "./wizard.module.css";

interface StepScreenProps {
  def: StepDef;
  controller: ProfileFormController;
  onCommit: () => void;
}

/** One question, large, with nothing else competing for attention. */
export function StepScreen({ def, controller, onCommit }: StepScreenProps) {
  const name = controller.form.name.trim();
  const helper = def.id === "gender" && name ? `Nice to meet you, ${name}. ${def.helper}` : def.helper;
  return (
    <>
      <span className={styles.tile} aria-hidden>{def.icon}</span>
      <h1 className={styles.title}>{def.title}</h1>
      {helper ? <p className={styles.helper}>{helper}</p> : <div className={styles.gap} />}
      <def.Editor controller={controller} onCommit={onCommit} />
    </>
  );
}
