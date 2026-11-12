import { useState } from "react";
import { saveProfile } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { clampKg, MAX_KG, MIN_KG, signedKg, WEIGHT_STEP_KG } from "../../domain/weighIns.ts";
import { formatDayLabel } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { parseNumber } from "../../lib/format.ts";
import { BigInput } from "../../ui/BigInput";
import { Button, IconButton } from "../../ui/Button";
import { IconMinus, IconPlus } from "../../ui/icons";
import { Sheet } from "../../ui/Sheet";
import styles from "./WeighIn.module.css";

interface Props {
  profile: Profile;
  onClose: () => void;
}

/** Today's weight: typed, or nudged a tenth at a time from the last one. Saving it updates the plan too. */
export function WeighInSheet({ profile, onClose }: Props) {
  const [text, setText] = useState(String(profile.weightKg));
  const kg = parseNumber(text);
  const valid = Number.isFinite(kg) && kg >= MIN_KG && kg <= MAX_KG;
  const nudge = (by: number) => setText(String(clampKg((valid ? kg : profile.weightKg) + by)));
  const change = valid ? clampKg(kg) - profile.weightKg : 0;
  const save = () => {
    if (!valid) return;
    saveProfile({ ...profile, weightKg: clampKg(kg) });
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Log your weight"
      subtitle="Same time, same scale each week: first thing in the morning works best"
      footer={<Button variant="primary" size="lg" block disabled={!valid} onClick={save}>Save weight</Button>}
    >
      <div className={styles.entry}>
        <IconButton label="Less" icon={<IconMinus />} variant="secondary" onClick={() => nudge(-WEIGHT_STEP_KG)} />
        <BigInput value={text} onChange={setText} label="Weight in kilograms" unit="kg" inputMode="decimal" invalid={!valid} onEnter={save} />
        <IconButton label="More" icon={<IconPlus />} variant="secondary" onClick={() => nudge(WEIGHT_STEP_KG)} />
      </div>
      <p className={cx(styles.last, "num")}>
        {valid ? (
          <>Last: {formatKg(profile.weightKg)}{profile.weightDate && <> on {formatDayLabel(profile.weightDate, { day: "numeric", month: "short" })}</>}{change !== 0 && <> · <b>{signedKg(change)} kg</b></>}</>
        ) : (
          `Enter a weight from ${MIN_KG} to ${MAX_KG} kg`
        )}
      </p>
    </Sheet>
  );
}
