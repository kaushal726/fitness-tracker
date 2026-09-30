import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { IconChevronRight } from "./icons";
import styles from "./SettingsList.module.css";

export type RowTone = "green" | "blue" | "amber" | "rose" | "slate";

export function SettingsGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      {label && <h2 className={styles.label}>{label}</h2>}
      <div className={styles.group}>{children}</div>
    </section>
  );
}

interface SettingsRowProps {
  icon?: ReactNode;
  tone?: RowTone;
  title: string;
  subtitle?: string;
  /** Shown on the right, before the chevron. */
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  /** Marks a row whose answer is missing or wrong. */
  invalid?: boolean;
}

export function SettingsRow({ icon, tone = "slate", title, subtitle, value, onClick, danger, invalid }: SettingsRowProps) {
  const content = (
    <>
      {icon && <span className={cx(styles.tile, styles[tone], danger && styles.dangerTile)} aria-hidden>{icon}</span>}
      <span className={styles.text}>
        <span className={cx(styles.title, danger && styles.danger)}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {value && <span className={cx(styles.value, invalid && styles.invalid)}>{value}</span>}
      {onClick && !danger && <IconChevronRight className={styles.chevron} aria-hidden />}
    </>
  );
  return onClick ? (
    <button type="button" className={styles.row} onClick={onClick}>{content}</button>
  ) : (
    <div className={styles.row}>{content}</div>
  );
}
