import { useMemo, useState } from "react";
import { caloriesByDate, entriesOn, groupByMeal, loggedDates, sumEntries } from "../../data/selectors.ts";
import { useAppState } from "../../data/store.ts";
import type { Entry, Profile } from "../../data/types.ts";
import { currentStreak } from "../../domain/breakdowns.ts";
import { computePlan } from "../../domain/goals.ts";
import { weighInDue } from "../../domain/weighIns.ts";
import { calorieStatus, END_OF_DAY_HOUR, proteinShortfall } from "../../domain/insights.ts";
import { mealForTime } from "../../domain/meals.ts";
import { useHeldWhileCovered } from "../../lib/covered.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { CalorieHero } from "./CalorieHero.tsx";
import { DayHeader } from "./DayHeader.tsx";
import { EditEntrySheet } from "../add/EditEntrySheet.tsx";
import { IdeasSheet } from "../ideas/IdeasSheet.tsx";
import { ShareDaySheet } from "../share/ShareDaySheet.tsx";
import { useDayIdeas } from "../ideas/useDayIdeas.ts";
import { useWater } from "../water/useWater.ts";
import { WaterCard } from "../water/WaterCard.tsx";
import { WaterSheet } from "../water/WaterSheet.tsx";
import { useWeightPoints } from "../weight/useWeightPoints.ts";
import { WeighInCard } from "../weight/WeighInCard.tsx";
import { WeighInSheet } from "../weight/WeighInSheet.tsx";
import { MacroGrid } from "./MacroGrid.tsx";
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
  const { entries: liveEntries, settings } = useAppState();
  // Food added on the page over this one shows up, and counts, when that page is gone.
  const entries = useHeldWhileCovered(liveEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const water = useWater(date);
  const weightPoints = useWeightPoints(profile);
  const askWeight = date === today && weighInDue(weightPoints, today);

  const plan = useMemo(() => computePlan(profile, settings.customCalories), [profile, settings.customCalories]);
  const dayEntries = useMemo(() => entriesOn(entries, date), [entries, date]);
  const totals = useMemo(() => sumEntries(dayEntries), [dayEntries]);
  const byMeal = useMemo(() => groupByMeal(dayEntries), [dayEntries]);
  const eatenByDay = useMemo(() => caloriesByDate(entries), [entries]);
  const streak = useMemo(() => currentStreak(new Set(loggedDates(entries)), today), [entries, today]);
  const editing: Entry | undefined = dayEntries.find((e) => e.id === editingId);
  const currentMeal = date === today ? mealForTime(new Date(), settings.mealStartHours) : null;
  const ideas = useDayIdeas(totals, plan.targets, date === today);
  const seeIdeas = ideas.length > 0 ? () => setIdeasOpen(true) : undefined;
  const status = dayEntries.length > 0 ? calorieStatus(totals, plan.targets) : null;
  // A day that is over is judged on all of it; today only once it is late enough for protein to matter.
  const hour = date === today ? new Date().getHours() : date < today ? END_OF_DAY_HOUR : 0;
  const proteinShort = dayEntries.length > 0 ? proteinShortfall(totals, plan.targets, hour) : null;
  const alerts = proteinShort === null ? undefined : { protein: { text: `${proteinShort} g short`, onOpen: seeIdeas } };

  return (
    <>
      <DayHeader date={date} today={today} name={profile.name} streak={streak} onBackToToday={() => onSelectDate(today)} />
      <WeekStrip selected={date} today={today} caloriesByDate={eatenByDay} goal={plan.targets.calories} onSelect={onSelectDate} />
      <div className={styles.layout}>
        <div className={styles.aside}>
          <CalorieHero totals={totals} targets={plan.targets} status={status} onSeeIdeas={seeIdeas} onShare={dayEntries.length > 0 ? () => setSharing(true) : undefined} />
        </div>
        <div className={styles.tiles}>
          {askWeight && <WeighInCard profile={profile} index={1} onLog={() => setWeighing(true)} />}
          <MacroGrid totals={totals} targets={plan.targets} index={1} alerts={alerts} />
          <WaterCard water={water} index={2} onOpen={() => setWaterOpen(true)} />
        </div>
        <div className={styles.meals}>
          <MealList key={date} byMeal={byMeal} currentMeal={currentMeal} dayCalories={plan.targets.calories} onOpenEntry={(e) => setEditingId(e.id)} onAdd={onAdd} />
        </div>
      </div>

      {weighing && <WeighInSheet profile={profile} onClose={() => setWeighing(false)} />}
      {waterOpen && <WaterSheet date={date} onClose={() => setWaterOpen(false)} />}
      {sharing && <ShareDaySheet profile={profile} date={date} onClose={() => setSharing(false)} />}
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
