import type { ReactNode } from "react";
import styles from "./SectionLabel.module.css";

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className={styles.row}>
      <h2 className={styles.label}>{children}</h2>
      {right}
    </div>
  );
}
