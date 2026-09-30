import { cx } from "../lib/cx";
import styles from "./Segmented.module.css";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div className={cx(styles.segmented, className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={styles.segment} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
