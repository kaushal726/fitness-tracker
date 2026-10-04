import { useMemo, useState } from "react";
import { entriesOn, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { monthOf, type MonthId } from "../../domain/month.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { EmptyState } from "../../ui/EmptyState";
import { IconInsights } from "../../ui/icons";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { DayIdeasList } from "../ideas/DayIdeasList.tsx";
import { useDayIdeas } from "../ideas/useDayIdeas.ts";
import { ConsistencyCard } from "./ConsistencyCard.tsx";
import { DailyCard } from "./DailyCard.tsx";
import { FoodsCard } from "./FoodsCard.tsx";
import { InsightCard } from "./InsightCard.tsx";
import { MacroCard } from "./MacroCard.tsx";
import { MealCard } from "./MealCard.tsx";
import { MonthGoalCard } from "./MonthGoalCard.tsx";
import { MonthSwitcher } from "./MonthSwitcher.tsx";
import { useMonthInsights } from "./useMonthInsights.ts";
import { WeekdayCard } from "./WeekdayCard.tsx";
import styles from "./InsightsScreen.module.css";

interface Props {
  profile: Profile;
  today: string;
  /** Opens the add page on a food that was suggested. */
  onAdd: (meal: MealType | null, food?: Food) => void;
}

/** How the month is going, in charts: the budget and its balance, the days, the nutrients, the meals, the foods. */
export function InsightsScreen({ profile, today, onAdd }: Props) {
  const { entries } = useAppState();
  const current = monthOf(today);
  const [month, setMonth] = useState<MonthId>(current);
  const { insights, targets, direction } = useMonthInsights(profile, today, month);
  const earliest = useMemo(() => entries.reduce((first, e) => (e.date < first ? e.date : first), today).slice(0, 7), [entries, today]);
  const todayTotals = useMemo(() => sumEntries(entriesOn(entries, today)), [entries, today]);
  const ideas = useDayIdeas(todayTotals, targets, month === current);

  if (entries.length === 0) {
    return (
      <>
        <ScreenHeader eyebrow="Your progress" title="Insights" />
        <EmptyState icon={<IconInsights />} title="Nothing to show yet" message="Log a few days and this page fills with charts: how the month is going against your goal, and where it can be made up." />
      </>
    );
  }

  return (
    <>
      <ScreenHeader eyebrow="Your progress" title="Insights" />
      <MonthSwitcher month={month} current={current} earliest={earliest} onChange={setMonth} />
      <div className={styles.grid}>
        <div className={styles.wide}><MonthGoalCard month={insights} direction={direction} /></div>
        {ideas.length > 0 && (
          <InsightCard label="Ideas for today" className={styles.wide}>
            <DayIdeasList groups={ideas} compact onPick={(food) => onAdd(null, food)} />
          </InsightCard>
        )}
        <div className={styles.wide}><DailyCard month={insights} /></div>
        <MacroCard month={insights} targets={targets} />
        <MealCard month={insights} entries={entries} />
        <WeekdayCard month={insights} />
        <FoodsCard entries={entries} month={month} />
        <div className={styles.wide}><ConsistencyCard month={insights} entries={entries} today={today} /></div>
      </div>
    </>
  );
}
