const LOCALE = "en-IN";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). Calendar days, so a clock change does not matter. */
export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return iso ? parseISODate(iso).toLocaleDateString(LOCALE, opts) : "";
}

export function formatDayLabel(iso: string, otherDays: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  if (iso === addDays(today, 1)) return "Tomorrow";
  return formatDate(iso, otherDays);
}

/** "12:30 PM": upper-case AM/PM reads as a clock time rather than a note. */
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" }).toUpperCase();
}

/** The given day, at the time of day of `clock`. Used to log into a past day without inventing a time. */
export function atTimeOfDay(iso: string, clock: Date): Date {
  const d = parseISODate(iso);
  d.setHours(clock.getHours(), clock.getMinutes(), clock.getSeconds(), 0);
  return d;
}
