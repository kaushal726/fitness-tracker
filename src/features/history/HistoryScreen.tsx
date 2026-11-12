import { useMemo } from "react";
import { entriesOn, loggedDates, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { groupByWeek, weekStartOf } from "../../domain/dayVerdict.ts";
import { computePlan } from "../../domain/goals.ts";
import { addDays, formatDate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { EmptyState } from "../../ui/EmptyState";
import { IconHistory } from "../../ui/icons";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { SectionLabel } from "../../ui/SectionLabel";
import { DayRow } from "./DayRow.tsx";
import { WeekChart } from "./WeekChart.tsx";
import styles from "./history.module.css";

interface Props {
  profile: Profile;
  today: string;
  onOpenDay: (date: string) => void;
}

const MAX_DAYS = 45;
const DAYS_IN_WEEK = 7;
const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** "This week", "Last week", or the dates the week runs between. */
function weekLabel(start: string, today: string): string {
  const thisWeek = weekStartOf(today);
  if (start === thisWeek) return "This week";
  if (start === addDays(thisWeek, -DAYS_IN_WEEK)) return "Last week";
  return `${formatDate(start, SHORT_DATE)} – ${formatDate(addDays(start, DAYS_IN_WEEK - 1), SHORT_DATE)}`;
}

export function HistoryScreen({ profile, today, onOpenDay }: Props) {
  const { entries, settings } = useAppState();
  const goal = useMemo(() => computePlan(profile, settings.customCalories).targets.calories, [profile, settings.customCalories]);

  const days = useMemo(
    () => loggedDates(entries).slice(0, MAX_DAYS).map((date) => ({ date, totals: sumEntries(entriesOn(entries, date)) })),
    [entries],
  );
  const weeks = useMemo(() => groupByWeek(days, (d) => d.date), [days]);
  const caloriesByDate = useMemo(() => new Map(days.map((d) => [d.date, d.totals.calories])), [days]);

  let index = 0;
  return (
    <>
      <ScreenHeader eyebrow="Your days" title="History" />
      {days.length === 0 ? (
        <EmptyState icon={<IconHistory />} title="Nothing here yet" message="The days you log will show up here, with how each one went against your goal." />
      ) : (
        <div className={styles.layout}>
          <div className={styles.aside}>
            <WeekChart today={today} goal={goal} caloriesByDate={caloriesByDate} />
          </div>
          <div className={styles.main}>
            {weeks.map((week) => {
              const average = week.items.reduce((sum, d) => sum + d.totals.calories, 0) / week.items.length;
              return (
                <section key={week.start} className={styles.week} aria-label={weekLabel(week.start, today)}>
                  <SectionLabel right={<span className={styles.weekAverage}>{formatNumber(average)} kcal a day</span>}>{weekLabel(week.start, today)}</SectionLabel>
                  <div className={styles.list}>
                    {week.items.map((d) => (
                      <DayRow key={d.date} date={d.date} calories={d.totals.calories} goal={goal} isToday={d.date === today} index={index++} onOpen={onOpenDay} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
