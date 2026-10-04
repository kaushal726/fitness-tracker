import type { BalanceNote } from "../../domain/balanceNote.ts";
import { cx } from "../../lib/cx.ts";
import { IconAlert, IconCheck, IconInfo } from "../../ui/icons";
import styles from "./InsightNote.module.css";

const ICONS = { good: IconCheck, warn: IconAlert, info: IconInfo } as const;

/** What the numbers mean, in a headline and a line: the one place on the page that is words. */
export function InsightNote({ note }: { note: BalanceNote }) {
  const Icon = ICONS[note.tone];
  return (
    <div className={cx(styles.note, styles[note.tone])} role="status">
      <Icon className={styles.icon} aria-hidden />
      <div>
        <p className={styles.headline}>{note.headline}</p>
        <p className={styles.detail}>{note.detail}</p>
      </div>
    </div>
  );
}
