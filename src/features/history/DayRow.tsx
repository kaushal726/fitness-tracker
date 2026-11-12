import type { CSSProperties } from "react";
import { dayVerdict, type DayVerdict } from "../../domain/dayVerdict.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { formatDayLabel } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { IconChevronRight } from "../../ui/icons";
import { Ring } from "../../ui/Ring";
import styles from "./DayRow.module.css";

const RING_SIZE = 46;
const RING_STROKE = 4;
const PERCENT = 100;
/** Rows further down arrive with the last of the first screenful, not one by one. */
const MAX_STAGGER = 8;

interface Props {
  date: string;
  calories: number;
  goal: number;
  /** Today is still going: what is under the goal is what is left, not a shortfall. */
  isToday: boolean;
  /** Its place in the list: the rows arrive one after another. */
  index: number;
  onOpen: (date: string) => void;
}

function verdictText({ kind, amount }: DayVerdict, isToday: boolean): string {
  if (kind === "over") return `${formatNumber(amount)} kcal over`;
  if (kind === "under") return `${formatNumber(amount)} kcal ${isToday ? "left" : "under"}`;
  return "On track";
}

/** One logged day, kept to a glance: a ring of how much of the goal was eaten, the day, how it went, and the calories. */
export function DayRow({ date, calories, goal, isToday, index, onOpen }: Props) {
  const animates = useAnimatesIn();
  const verdict = dayVerdict(calories, goal);
  const over = verdict.kind === "over";
  const share = goal > 0 ? Math.round((calories / goal) * PERCENT) : 0;
  return (
    <button type="button" className={cx(styles.row, animates && "motion-rise")} style={{ "--i": Math.min(index, MAX_STAGGER) } as CSSProperties} onClick={() => onOpen(date)}>
      <Ring value={calories} max={goal} size={RING_SIZE} stroke={RING_STROKE} tone={over ? "over" : "primary"} label={`${share}% of the goal`}>
        <span className={cx(styles.share, "num")}>{share}%</span>
      </Ring>
      <span className={styles.main}>
        <span className={styles.title}>{formatDayLabel(date)}</span>
        <span className={cx(styles.verdict, styles[verdict.kind], isToday && styles.today, "num")}>{verdictText(verdict, isToday)}</span>
      </span>
      <span className={cx(styles.kcal, "num", over && styles.overText)}>{formatNumber(calories)}<small> kcal</small></span>
      <IconChevronRight className={styles.chevron} aria-hidden />
    </button>
  );
}
