import type { Profile } from "../../data/types.ts";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { BmiCard } from "./BmiCard.tsx";
import { EnergyCard } from "./EnergyCard.tsx";
import { ProgressCard } from "./ProgressCard.tsx";
import { ProteinCard } from "./ProteinCard.tsx";
import { useBodyProgress } from "./useBodyProgress.ts";
import { WeeksCard } from "./WeeksCard.tsx";
import styles from "./BodyScreen.module.css";

interface Props {
  profile: Profile;
  today: string;
}

/** The body, in numbers: where the weight stands, where the food is taking it, and how long that takes. */
export function BodyScreen({ profile, today }: Props) {
  const view = useBodyProgress(profile, today);
  return (
    <>
      <ScreenHeader eyebrow="Your body" title="Body" />
      <div className={styles.grid}>
        <div className={styles.wide}><ProgressCard profile={profile} view={view} /></div>
        <BmiCard profile={profile} view={view} />
        <EnergyCard view={view} />
        <WeeksCard view={view} />
        <ProteinCard view={view} />
      </div>
    </>
  );
}
