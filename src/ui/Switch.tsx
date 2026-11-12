import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./Switch.module.css";

interface SwitchProps {
  label: ReactNode;
  /** A quiet line under the label. */
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** A row with a label and an on/off switch at its end; the whole row toggles it. */
export function Switch({ label, hint, checked, onChange, disabled }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.row} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <span className={cx(styles.track, checked && styles.on)} aria-hidden>
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
