import { formatDate, formatDayLabel } from "../../lib/dates.ts";
import { Button } from "../../ui/Button";
import { ScreenHeader } from "../../ui/ScreenHeader";

const MORNING_UNTIL = 12;
const AFTERNOON_UNTIL = 17;

function greeting(hour: number): string {
  if (hour < MORNING_UNTIL) return "Good morning";
  return hour < AFTERNOON_UNTIL ? "Good afternoon" : "Good evening";
}

interface Props {
  date: string;
  today: string;
  name: string;
  onBackToToday: () => void;
}

/** A greeting on today; the day's name on any other day. Always one line each, whatever the name's length. */
export function DayHeader({ date, today, name, onBackToToday }: Props) {
  if (date !== today) {
    return (
      <ScreenHeader
        eyebrow={formatDate(date, { day: "numeric", month: "long", year: "numeric" })}
        title={formatDayLabel(date, { weekday: "long" })}
        actions={<Button size="sm" onClick={onBackToToday}>Back to today</Button>}
      />
    );
  }
  const hello = greeting(new Date().getHours());
  return name
    ? <ScreenHeader eyebrow={hello} title={name} />
    : <ScreenHeader eyebrow={formatDate(date, { weekday: "long", day: "numeric", month: "long" })} title={hello} />;
}
