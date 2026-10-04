import type { Profile } from "../../data/types.ts";
import { bmi, bmiBand } from "../../domain/bmi.ts";
import { bmiNote } from "../../domain/bmiNote.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { InsightCard } from "../insights/InsightCard.tsx";
import { InsightNote } from "../insights/InsightNote.tsx";
import { Readout } from "../insights/Readout.tsx";
import { BmiScale } from "./BmiScale.tsx";
import type { BodyView } from "./useBodyProgress.ts";
import styles from "./BmiCard.module.css";

interface Props {
  profile: Profile;
  view: BodyView;
}

/** BMI at the estimated weight now, on the four usual bands, with where the target weight would put it. */
export function BmiCard({ profile, view }: Props) {
  const weight = view.progress.currentKg;
  const value = bmi(weight, profile.heightCm);
  const band = bmiBand(value);
  const targetKg = profile.targetWeightKg;
  const targetBmi = targetKg === null ? null : bmi(targetKg, profile.heightCm);

  return (
    <InsightCard label="BMI" tag={band.label}>
      <Readout value={value.toFixed(1)} unit="BMI" caption={`At ${formatKg(weight)} and ${profile.heightCm} cm`} />
      <BmiScale value={value} target={targetBmi} />
      <InsightNote note={bmiNote(weight, profile.heightCm)} />
      {targetKg !== null && targetBmi !== null && (
        <p className={styles.target}>At your target of {formatKg(targetKg)} the BMI would be {targetBmi.toFixed(1)}: {bmiBand(targetBmi).label.toLowerCase()}.</p>
      )}
    </InsightCard>
  );
}
