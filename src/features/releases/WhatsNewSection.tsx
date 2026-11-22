import { useState } from "react";
import { latestRelease } from "../../app/releaseNotes.ts";
import { markReleaseSeen, useSeenRelease } from "../../app/releaseSeen.ts";
import { IconSparkles } from "../../ui/icons";
import { SettingsGroup, SettingsRow } from "../../ui/SettingsList";
import { ReleaseChanges } from "./ReleaseChanges.tsx";
import { ReleaseHistorySheet } from "./ReleaseHistorySheet.tsx";
import styles from "./releases.module.css";

/** Profile's "What's new": the newest release's note, always on show, and the way to every earlier one. */
export function WhatsNewSection() {
  const release = latestRelease();
  const seen = useSeenRelease();
  const [history, setHistory] = useState(false);
  const unseen = seen !== release.version;

  return (
    <>
      <SettingsGroup label="What's new">
        <div className={styles.card}>
          <header className={styles.cardHead}>
            <div>
              <h2 className={styles.releaseTitle}>{release.title}</h2>
              <p className={styles.releaseMeta}>Version {release.version} · {release.date}</p>
            </div>
            {unseen && <span className={styles.newDot}>New</span>}
          </header>
          <ReleaseChanges release={release} />
        </div>
        <SettingsRow
          icon={<IconSparkles />}
          tone="green"
          title="All updates"
          subtitle="What each version brought"
          onClick={() => {
            markReleaseSeen(release.version);
            setHistory(true);
          }}
        />
      </SettingsGroup>
      {history && <ReleaseHistorySheet onClose={() => setHistory(false)} />}
    </>
  );
}
