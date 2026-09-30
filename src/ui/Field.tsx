import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, optional, hint, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {optional && <span className={styles.optional}> · optional</span>}
      </label>
      {children}
      {error ? <p className={styles.error} role="alert">{error}</p> : hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  /** A unit shown inside the field, after the value: "kcal", "g". */
  suffix?: string;
};

export function TextField({ label, value, onChange, optional, hint, error, suffix, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} optional={optional} hint={hint} error={error}>
      <div className={cx(styles.control, error && styles.invalid)}>
        <input id={id} className={cx(styles.input, className)} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} {...rest} />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    </Field>
  );
}
