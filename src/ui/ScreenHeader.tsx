import type { ReactNode } from "react";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

/** The title block that opens a screen. One line each, so a long name never breaks the layout. */
export function ScreenHeader({ title, eyebrow, actions }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
