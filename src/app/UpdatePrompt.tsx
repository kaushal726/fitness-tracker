import { useState } from "react";
import { Button } from "../ui/Button";
import { IconSparkles } from "../ui/icons";
import { useUpdateAvailable } from "./pwa";
import styles from "./UpdatePrompt.module.css";

/** Offers the newer build, then shows it installing until the page reloads itself. */
export function UpdatePrompt() {
  const apply = useUpdateAvailable();
  const [updating, setUpdating] = useState(false);
  if (!apply) return null;

  const update = () => {
    setUpdating(true);
    apply();
  };

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden><IconSparkles /></span>
      <span className={styles.text}>
        <b>{updating ? "Updating…" : "A new version is ready"}</b>
        <small>{updating ? "This takes a second" : "Update to get the latest fixes"}</small>
      </span>
      <Button size="sm" variant="primary" onClick={update} disabled={updating}>{updating ? "Updating" : "Update"}</Button>
    </div>
  );
}
