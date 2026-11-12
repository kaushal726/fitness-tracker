import type { CSSProperties } from "react";
import type { Profile } from "../../data/types.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { formatDayLabel } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { IconScale } from "../../ui/icons";
import styles from "./WeighIn.module.css";

interface Props {
  profile: Profile;
  /** Its place on the page: it arrives after what is above it. */
  index: number;
  onLog: () => void;
}

/** The Saturday ask: step on the scale and log this week's weight. */
export function WeighInCard({ profile, index, onLog }: Props) {
  const animates = useAnimatesIn();
  return (
    <Card className={cx(styles.card, animates && "motion-rise")} style={{ "--i": index } as CSSProperties} role="region" aria-label="Weigh-in day">
      <span className={styles.icon} aria-hidden><IconScale /></span>
      <span className={styles.text}>
        <span className={styles.title}>Weigh-in day</span>
        <span className={cx(styles.detail, "num")}>
          Log this week's weight to see where you are heading.{" "}
          <span className={styles.nowrap}>
            Last: {formatKg(profile.weightKg)}
            {profile.weightDate && <> on {formatDayLabel(profile.weightDate, { day: "numeric", month: "short" })}</>}
          </span>
        </span>
      </span>
      <Button variant="primary" size="sm" onClick={onLog}>Log</Button>
    </Card>
  );
}
