import { IconFlame } from "../../ui/icons";
import styles from "./StreakChip.module.css";

/** A run shorter than this is not worth a mention. */
const MIN_STREAK = 2;

/** How many days in a row something was logged: a small pat on the back, shown once there is a run to speak of. */
export function StreakChip({ days }: { days: number }) {
  if (days < MIN_STREAK) return null;
  return (
    <span className={styles.chip} role="img" aria-label={`Logged ${days} days in a row`} title={`Logged ${days} days in a row`}>
      <IconFlame aria-hidden />
      <span className="num">{days}</span>
      <small>days</small>
    </span>
  );
}
