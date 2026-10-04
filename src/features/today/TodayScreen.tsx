import { useMemo, useState } from "react";
import { entriesOn, groupByMeal, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Entry, Profile } from "../../data/types.ts";
import { computePlan } from "../../domain/goals.ts";
import { dayInsight } from "../../domain/insights.ts";
import { mealForTime } from "../../domain/meals.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { CalorieHero } from "./CalorieHero.tsx";
import { DayHeader } from "./DayHeader.tsx";
import { EditEntrySheet } from "../add/EditEntrySheet.tsx";
import { IdeasSheet } from "../ideas/IdeasSheet.tsx";
import { useDayIdeas } from "../ideas/useDayIdeas.ts";
import { InsightPill } from "./InsightPill.tsx";
import { MealList } from "./MealList.tsx";
import { WeekStrip } from "./WeekStrip.tsx";
import styles from "./TodayScreen.module.css";

interface Props {
  profile: Profile;
  /** The day on screen. */
  date: string;
  today: string;
  onSelectDate: (date: string) => void;
  /** Opens the add page: for a meal, or straight to a food that was suggested. */
  onAdd: (meal: MealType | null, food?: Food) => void;
}

/** Home: how the day is going, and its meals. Adding food is always one tap away in the dock. */
export function TodayScreen({ profile, date, today, onSelectDate, onAdd }: Props) {
  const { entries, settings } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);

  const plan = useMemo(() => computePlan(profile, settings.customCalories), [profile, settings.customCalories]);
  const dayEntries = useMemo(() => entriesOn(entries, date), [entries, date]);
  const totals = useMemo(() => sumEntries(dayEntries), [dayEntries]);
  const byMeal = useMemo(() => groupByMeal(dayEntries), [dayEntries]);
  const logged = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const editing: Entry | undefined = dayEntries.find((e) => e.id === editingId);
  const insight = dayInsight(totals, plan.targets, dayEntries.length > 0, new Date().getHours());
  const currentMeal = date === today ? mealForTime(new Date(), settings.mealStartHours) : null;
  const ideas = useDayIdeas(totals, plan.targets, date === today);
  // Only a line that is a warning has more to say; a day that is fine stays a quiet sentence.
  const canSuggest = insight?.tone === "warn" && ideas.length > 0;

  return (
    <>
      <DayHeader date={date} today={today} name={profile.name} onBackToToday={() => onSelectDate(today)} />
      <WeekStrip selected={date} today={today} logged={logged} onSelect={onSelectDate} />
      <div className={styles.layout}>
        <div className={styles.aside}>
          <CalorieHero totals={totals} targets={plan.targets} />
          {insight && <InsightPill insight={insight} onOpen={canSuggest ? () => setIdeasOpen(true) : undefined} />}
        </div>
        <div className={styles.meals}>
          <MealList key={date} byMeal={byMeal} currentMeal={currentMeal} onOpenEntry={(e) => setEditingId(e.id)} onAdd={onAdd} />
        </div>
      </div>

      {editing && <EditEntrySheet entry={editing} onClose={() => setEditingId(null)} />}
      {ideasOpen && (
        <IdeasSheet
          groups={ideas}
          onClose={() => setIdeasOpen(false)}
          onPick={(food) => {
            setIdeasOpen(false);
            onAdd(null, food);
          }}
        />
      )}
    </>
  );
}
