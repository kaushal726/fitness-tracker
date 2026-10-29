import { useEffect, useMemo, useRef } from "react";
import { addDays, parseISODate } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { IconButton } from "../../ui/Button";
import { IconChevronLeft, IconChevronRight } from "../../ui/icons";
import { Ring } from "../../ui/Ring";
import styles from "./WeekStrip.module.css";

/** How far back the strip reaches. Older days are one tap away in History. */
const DAYS_SHOWN = 60;
const PAGE_SHARE = 0.8;
/** A day is over its goal when it goes this far past it, so a few calories do not turn the ring orange. */
const OVER_SHARE = 1.05;
const DAY_RING_SIZE = 38;
const DAY_RING_STROKE = 3.5;

interface Props {
  selected: string;
  today: string;
  /** Calories eaten on each day that has something logged. */
  caloriesByDate: Map<string, number>;
  /** What a day is measured against: each day wears a ring of how far it got. */
  goal: number;
  onSelect: (date: string) => void;
}

/** Days in a row, today at the end. Swipe back for earlier days. */
export function WeekStrip({ selected, today, caloriesByDate, goal, onSelect }: Props) {
  const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i - (DAYS_SHOWN - 1))), [today]);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  /** For a mouse: move most of a screenful of days at a time. */
  const page = (direction: 1 | -1) => stripRef.current?.scrollBy({ left: direction * stripRef.current.clientWidth * PAGE_SHARE, behavior: "smooth" });

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: firstRun.current ? "auto" : "smooth" });
    firstRun.current = false;
  }, [selected]);

  return (
    <div className={styles.wrap}>
      <IconButton className={cx(styles.arrow, "desktop-only")} label="Earlier days" icon={<IconChevronLeft />} variant="outline" onClick={() => page(-1)} />
      <div ref={stripRef} className={styles.strip} role="group" aria-label="Choose a day">
      {days.map((iso) => {
        const date = parseISODate(iso);
        const isSelected = iso === selected;
        const eaten = caloriesByDate.get(iso) ?? 0;
        return (
          <button
            key={iso}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            className={cx(styles.day, isSelected && styles.selected, iso === today && styles.today)}
            aria-pressed={isSelected}
            aria-label={date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            onClick={() => onSelect(iso)}
          >
            <span className={styles.weekday}>{date.toLocaleDateString("en-IN", { weekday: "short" })}</span>
            <Ring className={styles.dayRing} value={eaten} max={goal} size={DAY_RING_SIZE} stroke={DAY_RING_STROKE} tone={goal > 0 && eaten / goal > OVER_SHARE ? "over" : "primary"} label={goal > 0 ? `${Math.round((eaten / goal) * 100)}% of the goal` : "No goal"}>
              <span className={styles.number}>{date.getDate()}</span>
            </Ring>
          </button>
        );
      })}
      </div>
      <IconButton className={cx(styles.arrow, "desktop-only")} label="Later days" icon={<IconChevronRight />} variant="outline" onClick={() => page(1)} />
    </div>
  );
}
