import { useEffect, useState } from "react";
import { todayISO } from "../lib/dates.ts";

/** Today's date, refreshed when the app comes back to the front, so an app left open overnight is not a day behind. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return today;
}
