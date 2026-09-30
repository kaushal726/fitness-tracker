import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { IconCheck } from "./icons";
import styles from "./ChoiceList.module.css";

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

interface ChoiceListProps<T extends string> {
  choices: Choice<T>[];
  /** Null while nothing has been picked yet. */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}

/** One-of-many as tall, tappable cards: easy to hit, and each can explain itself. */
export function ChoiceList<T extends string>({ choices, value, onChange, label }: ChoiceListProps<T>) {
  return (
    <div className={styles.list} role="radiogroup" aria-label={label}>
      {choices.map((c) => (
        <button key={c.value} type="button" role="radio" aria-checked={c.value === value} className={cx(styles.choice, c.value === value && styles.selected)} onClick={() => onChange(c.value)}>
          {c.icon && <span className={styles.icon} aria-hidden>{c.icon}</span>}
          <span className={styles.text}>
            <span className={styles.label}>{c.label}</span>
            {c.hint && <span className={styles.hint}>{c.hint}</span>}
          </span>
          <span className={styles.mark} aria-hidden>{c.value === value && <IconCheck />}</span>
        </button>
      ))}
    </div>
  );
}
