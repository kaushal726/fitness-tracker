import type { Insight } from "../../domain/insights.ts";
import { cx } from "../../lib/cx.ts";
import { IconAlert, IconCheck, IconChevronRight, IconInfo } from "../../ui/icons";
import styles from "./InsightPill.module.css";

const ICONS = { good: IconCheck, warn: IconAlert, info: IconInfo } as const;

interface Props {
  insight: Insight;
  /** Given when there is more to see: the pill becomes a button that opens it. */
  onOpen?: () => void;
}

/** One short sentence about how the day is going. */
export function InsightPill({ insight, onOpen }: Props) {
  const Icon = ICONS[insight.tone];
  const content = (
    <>
      <Icon aria-hidden />
      <span className={styles.text}>{insight.text}</span>
      {onOpen && <IconChevronRight className={styles.more} aria-hidden />}
    </>
  );
  return onOpen ? (
    <button type="button" className={cx(styles.pill, styles[insight.tone], styles.action)} onClick={onOpen} aria-haspopup="dialog">{content}</button>
  ) : (
    <p className={cx(styles.pill, styles[insight.tone])} role="status">{content}</p>
  );
}
