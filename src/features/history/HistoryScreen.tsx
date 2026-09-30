import { useMemo } from "react";
import { entriesOn, loggedDates, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { computePlan } from "../../domain/goals.ts";
import { EmptyState } from "../../ui/EmptyState";
import { IconHistory } from "../../ui/icons";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { SectionLabel } from "../../ui/SectionLabel";
import { ThoughtCard } from "../thought/ThoughtCard.tsx";
import { DayRow } from "./DayRow.tsx";
import { WeekChart } from "./WeekChart.tsx";
import styles from "./history.module.css";

interface Props {
  profile: Profile;
  today: string;
  onOpenDay: (date: string) => void;
}

const MAX_DAYS = 45;

export function HistoryScreen({ profile, today, onOpenDay }: Props) {
  const { entries, settings } = useAppState();
  const goal = useMemo(() => computePlan(profile, settings.customCalories).targets.calories, [profile, settings.customCalories]);

  const days = useMemo(
    () => loggedDates(entries).slice(0, MAX_DAYS).map((date) => ({ date, totals: sumEntries(entriesOn(entries, date)) })),
    [entries],
  );
  const caloriesByDate = useMemo(() => new Map(days.map((d) => [d.date, d.totals.calories])), [days]);
  const thought = settings.dailyThought ? <ThoughtCard key={today} today={today} /> : null;

  return (
    <>
      <ScreenHeader eyebrow="Your days" title="History" />
      {days.length === 0 ? (
        <>
          <EmptyState icon={<IconHistory />} title="Nothing here yet" message="The days you log will show up here, with how each one went against your goal." />
          {thought}
        </>
      ) : (
        <div className={styles.layout}>
          <div className={styles.aside}>
            <WeekChart today={today} goal={goal} caloriesByDate={caloriesByDate} />
            {thought}
          </div>
          <div className={styles.main}>
            <SectionLabel>All days</SectionLabel>
            <div className={styles.list}>
              {days.map((d) => <DayRow key={d.date} date={d.date} totals={d.totals} goal={goal} onOpen={onOpenDay} />)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
