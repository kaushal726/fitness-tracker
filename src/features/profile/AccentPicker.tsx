import type { CSSProperties } from "react";
import { ACCENTS, type AccentId } from "../../app/accent.ts";
import { cx } from "../../lib/cx.ts";
import { IconCheck } from "../../ui/icons";
import styles from "./AccentPicker.module.css";

interface Props {
  value: AccentId;
  onChange: (id: AccentId) => void;
}

/** One round swatch per colour; the chosen one carries a tick as well as a ring, so it never depends on seeing the colour. */
export function AccentPicker({ value, onChange }: Props) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Color">
      {ACCENTS.map(({ id, label, color }) => (
        <button key={id} type="button" role="radio" aria-checked={id === value} aria-label={label} title={label} className={styles.swatch} onClick={() => onChange(id)}>
          <span className={cx(styles.dot, id === value && styles.selected)} style={{ "--swatch": color } as CSSProperties}>
            {id === value && <IconCheck />}
          </span>
        </button>
      ))}
    </div>
  );
}
