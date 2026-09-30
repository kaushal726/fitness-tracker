import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./Chip.module.css";

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  /** "radio" for one-of-many; "button" for a plain toggle or shortcut. */
  role?: "radio" | "button";
}

export function Chip({ selected, onClick, children, icon, role = "button" }: ChipProps) {
  const aria = role === "radio" ? { role, "aria-checked": selected } : { "aria-pressed": selected };
  return (
    <button type="button" className={cx(styles.chip, selected && styles.selected)} onClick={onClick} {...aria}>
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}
