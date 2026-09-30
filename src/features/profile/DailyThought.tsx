import { quoteForDay } from "../../quotes/daily.ts";
import styles from "./DailyThought.module.css";

/** Today's thought: one quiet, faded line at the foot of the profile, so it never competes with anything. */
export function DailyThought({ today }: { today: string }) {
  const { text, gloss, by } = quoteForDay(today);
  return (
    <figure className={styles.thought}>
      <blockquote className={styles.text}>{text}</blockquote>
      {gloss && <p className={styles.text}>{gloss}</p>}
      {by && <figcaption className={styles.by}>{by}</figcaption>}
    </figure>
  );
}
