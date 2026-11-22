import { RELEASES } from "../../app/releaseNotes.ts";
import { Sheet } from "../../ui/Sheet";
import { ReleaseChanges } from "./ReleaseChanges.tsx";
import styles from "./releases.module.css";

/** Every release so far, the newest first. */
export function ReleaseHistorySheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="All updates" subtitle="What each version brought" size="full">
      <div className={styles.history}>
        {RELEASES.map((release) => (
          <section key={release.version} className={styles.historyItem}>
            <header className={styles.historyHead}>
              <h2 className={styles.releaseTitle}>{release.title}</h2>
              <p className={styles.releaseMeta}>Version {release.version} · {release.date}</p>
            </header>
            <ReleaseChanges release={release} />
          </section>
        ))}
      </div>
    </Sheet>
  );
}
