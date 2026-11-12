import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { IconChevronDown } from "./icons";
import { Menu, type MenuOption } from "./Menu";
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

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MenuOption<string>[];
  optional?: boolean;
  hint?: ReactNode;
}

/** A dropdown that looks like the text fields and opens the app's own small menu under it. */
export function SelectField({ label, value, onChange, options, optional, hint }: SelectFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chosen = options.find((o) => o.value === value);
  return (
    <Field label={label} htmlFor={id} optional={optional} hint={hint}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={cx(styles.control, styles.select, open && styles.selectOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.selectValue}>{chosen?.label ?? value}</span>
        <IconChevronDown className={styles.caret} aria-hidden />
      </button>
      {open && <Menu anchor={triggerRef} options={options} value={value} label={label} matchWidth onPick={onChange} onClose={() => setOpen(false)} />}
    </Field>
  );
}
