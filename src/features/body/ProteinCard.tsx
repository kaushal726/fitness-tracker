import { formatKg } from "../../domain/progressNote.ts";
import { formatNumber } from "../../lib/format.ts";
import { ProgressBar } from "../../ui/ProgressBar";
import { InsightCard } from "../insights/InsightCard.tsx";
import { Readout } from "../insights/Readout.tsx";
import type { BodyView } from "./useBodyProgress.ts";
import styles from "./ProteinCard.module.css";

/** Protein against body weight, the way it is usually advised: grams for each kilogram. */
export function ProteinCard({ view }: { view: BodyView }) {
  const { goal, progress: p } = view;
  const perKg = p.avgProtein === null ? null : p.avgProtein / p.currentKg;
  const aim = goal.proteinPerKg;

  return (
    <InsightCard label="Protein" tag={`Aim ${aim} g per kg`}>
      {perKg === null || p.avgProtein === null ? (
        <p className={styles.empty}>Shows once a few days are logged.</p>
      ) : (
        <>
          <Readout value={perKg.toFixed(1)} unit="g per kg" caption={`${formatNumber(p.avgProtein)} g a day at ${formatKg(p.currentKg)}`} />
          <ProgressBar value={perKg} max={aim} tone="protein" label="Protein per kilogram against what your goal asks" />
          <p className={styles.line}>
            {perKg >= aim
              ? "You are getting what your goal asks for."
              : `About ${formatNumber(aim * p.currentKg)} g a day protects muscle while your weight changes: ${formatNumber(aim * p.currentKg - p.avgProtein)} g more than now.`}
          </p>
        </>
      )}
    </InsightCard>
  );
}
