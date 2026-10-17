import { useMemo, useState } from "react";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { computePlan } from "../../domain/goals.ts";
import { exportFileName, monthExport } from "../../domain/monthExport.ts";
import { monthOf, type MonthId } from "../../domain/month.ts";
import { downloadBlob } from "../../lib/files.ts";
import { copyText } from "../../lib/share.ts";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Segmented } from "../../ui/Segmented";
import { useToast } from "../../ui/Toast";
import { MonthSwitcher } from "../insights/MonthSwitcher.tsx";
import styles from "./ShareSheet.module.css";

interface Props {
  profile: Profile;
  today: string;
}

type Scope = "foods" | "totals";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "foods", label: "With foods" },
  { value: "totals", label: "Totals only" },
];
const BYTES_PER_KB = 1024;
const days = (n: number): string => `${n} ${n === 1 ? "day" : "days"}`;

/** A month as a report for an AI chat: with every food, or with totals only. Copy it, or save it as a file. */
export function ShareMonthCard({ profile, today }: Props) {
  const { entries, settings } = useAppState();
  const toast = useToast();
  const current = monthOf(today);
  const [month, setMonth] = useState<MonthId>(current);
  const [scope, setScope] = useState<Scope>("foods");
  const withFoods = scope === "foods";
  const earliest = useMemo(() => entries.reduce((first, e) => (e.date < first ? e.date : first), today).slice(0, 7), [entries, today]);
  const data = useMemo(
    () => monthExport({ profile, plan: computePlan(profile, settings.customCalories), entries, month, today, now: new Date(), includeFoods: withFoods }),
    [profile, settings.customCalories, entries, month, today, withFoods],
  );
  const json = useMemo(() => JSON.stringify(data, null, 1), [data]);
  const empty = data.summary.daysLogged === 0;

  const copy = async () => {
    const copied = await copyText(json);
    toast(copied ? "Report copied. Paste it into your AI chat." : "Could not copy: use Save report instead", copied ? undefined : { tone: "error" });
  };
  const save = () => {
    downloadBlob(new Blob([json], { type: "application/json" }), exportFileName(month, withFoods));
    toast("Report saved");
  };

  return (
    <Card className={styles.card} role="region" aria-label="Month report">
      <header className={styles.head}>
        <h3 className={styles.title}>Month</h3>
        <p className={styles.lead}>A report of the whole month</p>
      </header>
      <MonthSwitcher month={month} current={current} earliest={earliest} onChange={setMonth} />
      <Segmented label="What to include" value={scope} onChange={setScope} options={SCOPES} />
      <p className={styles.hint}>
        {empty
          ? "Nothing was logged in this month."
          : withFoods
            ? `${days(data.summary.daysLogged)} logged, ${data.entries.length} ${data.entries.length === 1 ? "food" : "foods"}, about ${Math.max(1, Math.round(json.length / BYTES_PER_KB))} KB. Every food with its amount and nutrition, day by day, plus your targets and body numbers. Your name is not in it.`
            : `${days(data.summary.daysLogged)} logged. Day totals, your targets and body numbers. No food names.`}
      </p>
      <div className={styles.actions}>
        <Button variant="primary" size="lg" disabled={empty} onClick={() => void copy()}>Copy report</Button>
        <Button variant="secondary" size="lg" disabled={empty} onClick={save}>Save report</Button>
      </div>
      <p className={styles.hint}>Made for AI chats: paste it into ChatGPT, Claude or Gemini, or attach the saved file, then ask about your eating, your goal, or what to change.</p>
    </Card>
  );
}
