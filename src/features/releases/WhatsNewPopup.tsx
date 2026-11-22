import { useEffect, useState } from "react";
import { latestRelease } from "../../app/releaseNotes.ts";
import { hasSeenAnyRelease, markReleaseSeen, shouldShowReleaseNotes, useSeenRelease } from "../../app/releaseSeen.ts";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import { ReleaseChanges } from "./ReleaseChanges.tsx";
import styles from "./releases.module.css";

/** Long enough for the first screen to be seen before the note covers it. */
const SHOW_AFTER_MS = 900;

/** Tells whoever had the app before what the newest update brought, once. A first-time user is not shown it. */
export function WhatsNewPopup({ hasProfile }: { hasProfile: boolean }) {
  const release = latestRelease();
  const seen = useSeenRelease();
  const [due, setDue] = useState(false);

  // Someone still in onboarding has nothing to compare with: the note for this release is not for them.
  useEffect(() => {
    if (!hasProfile && !hasSeenAnyRelease()) markReleaseSeen(release.version);
  }, [hasProfile, release.version]);

  const show = shouldShowReleaseNotes({ seen, latest: release.version, hasProfile });
  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => setDue(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show || !due) return null;
  const close = () => markReleaseSeen(release.version);

  return (
    <Sheet
      open
      onClose={close}
      title="What's new"
      subtitle={`Version ${release.version} · ${release.date}`}
      footer={<Button variant="primary" size="lg" block onClick={close}>Got it</Button>}
    >
      <div className={styles.popup}>
        <h2 className={styles.releaseTitle}>{release.title}</h2>
        <ReleaseChanges release={release} />
      </div>
    </Sheet>
  );
}
