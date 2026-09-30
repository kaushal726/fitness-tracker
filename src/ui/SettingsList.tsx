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

interface RowLeadProps {
  icon?: ReactNode;
  tone: RowTone;
  danger?: boolean;
  title: string;
  subtitle?: string;
}

/** The icon tile and the two lines of text that start every row. */
function RowLead({ icon, tone, danger, title, subtitle }: RowLeadProps) {
  return (
    <>
      {icon && <span className={cx(styles.tile, styles[tone], danger && styles.dangerTile)} aria-hidden>{icon}</span>}
      <span className={styles.text}>
        <span className={cx(styles.title, danger && styles.danger)}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </>
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
      <RowLead icon={icon} tone={tone} danger={danger} title={title} subtitle={subtitle} />
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

interface SettingsToggleRowProps {
  icon?: ReactNode;
  tone?: RowTone;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A row with an on/off switch. The whole row is the tap target. */
export function SettingsToggleRow({ icon, tone = "slate", title, subtitle, checked, onChange }: SettingsToggleRowProps) {
  return (
    <label className={cx(styles.row, styles.toggleRow)}>
      <RowLead icon={icon} tone={tone} title={title} subtitle={subtitle} />
      <input type="checkbox" role="switch" className={styles.switchInput} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.switchTrack} aria-hidden><span className={styles.switchThumb} /></span>
    </label>
  );
}
