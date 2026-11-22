import { CHANGE_LABELS, type Release } from "../../app/releaseNotes.ts";
import styles from "./releases.module.css";

/** One release's changes, each with what kind it is. Shared by the pop-up, the Profile section and the full list. */
export function ReleaseChanges({ release }: { release: Release }) {
  return (
    <ul className={styles.changes}>
      {release.changes.map((change) => (
        <li key={change.title} className={styles.change}>
          <span className={styles.kind} data-kind={change.kind}>{CHANGE_LABELS[change.kind]}</span>
          <div>
            <h3 className={styles.changeTitle}>{change.title}</h3>
            <p className={styles.changeText}>{change.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
