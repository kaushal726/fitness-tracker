import type { Insight } from "../../domain/insights.ts";
import { cx } from "../../lib/cx.ts";
import { IconAlert, IconCheck, IconInfo } from "../../ui/icons";
import styles from "./InsightPill.module.css";

const ICONS = { good: IconCheck, warn: IconAlert, info: IconInfo } as const;

/** One short sentence about how the day is going. */
export function InsightPill({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.tone];
  return (
    <p className={cx(styles.pill, styles[insight.tone])} role="status">
      <Icon aria-hidden />
      {insight.text}
    </p>
  );
}
