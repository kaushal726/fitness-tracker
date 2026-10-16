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
import { useToast } from "../../ui/Toast";
import { MonthSwitcher } from "../insights/MonthSwitcher.tsx";
import styles from "./ShareSheet.module.css";

interface Props {
  profile: Profile;
  today: string;
}

const BYTES_PER_KB = 1024;

/** A month of food, with the goals and body numbers, as JSON to paste or attach in an AI chat. */
export function ShareMonthCard({ profile, today }: Props) {
  const { entries, settings } = useAppState();
  const toast = useToast();
  const current = monthOf(today);
  const [month, setMonth] = useState<MonthId>(current);
  const earliest = useMemo(() => entries.reduce((first, e) => (e.date < first ? e.date : first), today).slice(0, 7), [entries, today]);
  const data = useMemo(() => monthExport({ profile, plan: computePlan(profile, settings.customCalories), entries, month, today, now: new Date() }), [profile, settings.customCalories, entries, month, today]);
  const json = useMemo(() => JSON.stringify(data, null, 1), [data]);
  const empty = data.entries.length === 0;

  const copy = async () => {
    const copied = await copyText(json);
    toast(copied ? "Copied. Paste it into your AI chat." : "Could not copy: use Download instead", copied ? undefined : { tone: "error" });
  };
  const download = () => {
    downloadBlob(new Blob([json], { type: "application/json" }), exportFileName(month));
    toast("File saved");
  };

  return (
    <Card className={styles.card} role="region" aria-label="A month for an AI">
      <header className={styles.head}>
        <h3 className={styles.title}>Month</h3>
        <p className={styles.lead}>Everything you ate, for an AI</p>
      </header>
      <MonthSwitcher month={month} current={current} earliest={earliest} onChange={setMonth} />
      {empty ? (
        <p className={styles.hint}>Nothing was logged in this month.</p>
      ) : (
        <p className={styles.hint}>
          {data.summary.daysLogged} {data.summary.daysLogged === 1 ? "day" : "days"} logged, {data.entries.length} {data.entries.length === 1 ? "food" : "foods"}, about {Math.max(1, Math.round(json.length / BYTES_PER_KB))} KB. It has each food with its amount and nutrition, the totals day by day, your daily targets, and your body numbers and goal. Your name is not in it.
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="primary" size="lg" disabled={empty} onClick={() => void copy()}>Copy for AI</Button>
        <Button variant="secondary" size="lg" disabled={empty} onClick={download}>Download file</Button>
      </div>
      <p className={styles.hint}>Paste it into an AI chat, or attach the file, then ask about your eating, your goal, or what to change.</p>
    </Card>
  );
}
