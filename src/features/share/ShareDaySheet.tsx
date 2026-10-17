import type { Profile } from "../../data/types.ts";
import { Sheet } from "../../ui/Sheet";
import { ShareDayCard } from "./ShareDayCard.tsx";

interface Props {
  profile: Profile;
  /** The day on screen. */
  date: string;
  onClose: () => void;
}

/** Asks what goes in the picture of one day (with the foods, or the numbers only), shows it, and sends it. */
export function ShareDaySheet({ profile, date, onClose }: Props) {
  return (
    <Sheet open onClose={onClose} title="Share this day" subtitle="Choose what goes in the picture" size="full">
      <ShareDayCard profile={profile} date={date} showHead={false} />
    </Sheet>
  );
}
