import type { ReactNode } from "react";
import { cx } from "../../lib/cx.ts";
import { Card } from "../../ui/Card";
import styles from "./InsightCard.module.css";

interface Props {
  label: string;
  /** A short fact at the right of the label: "Goal 2,050", "Day 6 of 31". */
  tag?: string;
  children: ReactNode;
  className?: string;
}

/** One card of the Insights page: a small label, and one chart or figure under it. */
export function InsightCard({ label, tag, children, className }: Props) {
  return (
    <Card className={cx(styles.card, className)} role="region" aria-label={label}>
      <header className={styles.head}>
        <h2 className={styles.label}>{label}</h2>
        {tag && <span className={styles.tag}>{tag}</span>}
      </header>
      {children}
    </Card>
  );
}
