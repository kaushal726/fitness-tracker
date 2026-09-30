import { useId, type KeyboardEvent } from "react";
import { cx } from "../lib/cx";
import styles from "./BigInput.module.css";

interface BigInputProps {
  value: string;
  onChange: (value: string) => void;
  /** The accessible name; the visible question is the screen's heading. */
  label: string;
  unit?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  autoFocus?: boolean;
  invalid?: boolean;
  hint?: string;
  maxLength?: number;
  autoComplete?: string;
  onEnter?: () => void;
  onBlur?: () => void;
  size?: "lg" | "md";
}

/** The large underlined field the setup questions use: one thing to type, nothing else on screen. */
export function BigInput({ value, onChange, label, unit, placeholder, inputMode = "text", autoFocus, invalid, hint, maxLength, autoComplete, onEnter, onBlur, size = "lg" }: BigInputProps) {
  const hintId = useId();
  /** With a unit beside it, the field is only as wide as what is typed, so the unit sits right after the number. */
  const width = unit ? `${Math.max(value.length || placeholder?.length || 1, 1) + 0.15}ch` : undefined;
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onEnter?.();
  };
  return (
    <div className={styles.wrap}>
      <label className={cx(styles.row, size === "md" && styles.md, invalid && styles.invalid)}>
        <input
          className={cx(styles.input, unit && styles.fitted)}
          style={width ? { width } : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          inputMode={inputMode}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          autoComplete={autoComplete}
          enterKeyHint="next"
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </label>
      {hint && <p id={hintId} className={cx(styles.hint, invalid && styles.hintInvalid)}>{hint}</p>}
    </div>
  );
}
