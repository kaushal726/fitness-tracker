import type { Profile } from "../../data/types.ts";
import { Sheet } from "../../ui/Sheet";
import { ShareDayCard } from "./ShareDayCard.tsx";
import { ShareMonthCard } from "./ShareMonthCard.tsx";
import styles from "./ShareSheet.module.css";

interface Props {
  profile: Profile;
  today: string;
  onClose: () => void;
}

/** One place to share progress: today as a picture, any month as a report for an AI. Either can leave the foods out. */
export function ShareSheet({ profile, today, onClose }: Props) {
  return (
    <Sheet open onClose={onClose} title="Share your progress" subtitle="A picture of today, or a report of the month" size="full">
      <div className={styles.stack}>
        <ShareDayCard profile={profile} date={today} />
        <ShareMonthCard profile={profile} today={today} />
      </div>
    </Sheet>
  );
}
