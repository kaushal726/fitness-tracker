import { useEffect, useState } from "react";
import { onStorageError, useAppState } from "../data/store.ts";
import { AddFoodSheet } from "../features/add/AddFoodSheet.tsx";
import { HistoryScreen } from "../features/history/HistoryScreen.tsx";
import { Onboarding } from "../features/onboarding/Onboarding.tsx";
import { ProfileScreen } from "../features/profile/ProfileScreen.tsx";
import { TodayScreen } from "../features/today/TodayScreen.tsx";
import { endInstantArrival } from "../lib/arrival.ts";
import type { MealType } from "../nutrition/types.ts";
import { useToast } from "../ui/Toast";
import { Dock } from "./Dock.tsx";
import type { TabId } from "./navItems.ts";
import { Screen } from "./Screen.tsx";
import { SideNav } from "./SideNav.tsx";
import { UpdatePrompt } from "./UpdatePrompt.tsx";
import { useToday } from "./useToday.ts";
import styles from "./App.module.css";

interface AddRequest {
  meal: MealType | null;
  date: string;
}

export function App() {
  const { ready, profile } = useAppState();
  const toast = useToast();
  const today = useToday();
  const [tab, setTab] = useState<TabId>("today");
  /** Null means "follow today". */
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddRequest | null>(null);
  const date = pickedDate ?? today;

  const hasProfile = profile !== null;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hasProfile]);

  useEffect(() => onStorageError(() => toast("Couldn't save on this device. Free up some space and try again.", { tone: "error" })), [toast]);

  /** The first screen has been drawn; from here on, animations play as usual. */
  useEffect(() => {
    if (ready) endInstantArrival();
  }, [ready]);

  const selectTab = (next: TabId) => {
    if (next === "today" && tab === "today") setPickedDate(null);
    setTab(next);
    window.scrollTo(0, 0);
  };
  const selectDate = (day: string) => setPickedDate(day === today ? null : day);
  const openDay = (day: string) => {
    selectDate(day);
    selectTab("today");
  };
  /** Adds go to the day on screen when that is Today's screen, otherwise to today. */
  const openAdd = (meal: MealType | null) => setAdding({ meal, date: tab === "today" ? date : today });

  return (
    <>
      {ready && profile && (
        <>
          <SideNav active={tab} onSelect={selectTab} onAdd={() => openAdd(null)} />
          <main className={styles.main}>
            <Screen key={tab}>
              {tab === "today" && <TodayScreen profile={profile} date={date} today={today} onSelectDate={selectDate} onAdd={openAdd} />}
              {tab === "history" && <HistoryScreen profile={profile} today={today} onOpenDay={openDay} />}
              {tab === "profile" && <ProfileScreen profile={profile} today={today} />}
            </Screen>
          </main>
          <Dock active={tab} onSelect={selectTab} onAdd={() => openAdd(null)} />
          {adding && <AddFoodSheet date={adding.date} initialMeal={adding.meal} onClose={() => setAdding(null)} />}
          <UpdatePrompt />
        </>
      )}
      {ready && !profile && <Onboarding />}
    </>
  );
}
