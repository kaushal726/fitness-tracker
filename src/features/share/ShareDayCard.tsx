import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { dayReport } from "../../domain/dayReport.ts";
import { computePlan, goalDef } from "../../domain/goals.ts";
import { downloadBlob } from "../../lib/files.ts";
import { canShareFile, shareOrSave } from "../../lib/share.ts";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { useToast } from "../../ui/Toast";
import { renderDayImage } from "./renderDayImage.ts";
import styles from "./ShareSheet.module.css";

interface Props {
  profile: Profile;
  today: string;
}

interface Picture {
  file: File;
  url: string;
}

/** Today as a picture: calories against the goal, the macros and each meal, ready to send to a trainer or a group. */
export function ShareDayCard({ profile, today }: Props) {
  const { entries, settings } = useAppState();
  const toast = useToast();
  const report = useMemo(() => dayReport(entries, computePlan(profile, settings.customCalories).targets, today), [entries, profile, settings.customCalories, today]);
  const [picture, setPicture] = useState<Picture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPicture(null);
    setFailed(false);
    if (report.itemCount === 0) return;
    let cancelled = false;
    let url = "";
    renderDayImage(report, { name: profile.name, goalLabel: goalDef(profile.goal).label })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPicture({ file: new File([blob], `eatright-${today}.png`, { type: "image/png" }), url });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [report, profile.name, profile.goal, today]);

  const save = () => {
    if (!picture) return;
    downloadBlob(picture.file, picture.file.name);
    toast("Picture saved");
  };
  const share = async () => {
    if (!picture) return;
    if ((await shareOrSave(picture.file, "My day on EatRight")) === "saved") toast("Picture saved");
  };

  return (
    <Card className={styles.card} role="region" aria-label="Today as a picture">
      <header className={styles.head}>
        <h3 className={styles.title}>Today</h3>
        <p className={styles.lead}>A picture for your trainer or group</p>
      </header>
      {report.itemCount === 0 ? (
        <p className={styles.hint}>Nothing is logged today yet. Add what you ate and the picture is made from it.</p>
      ) : failed ? (
        <p className={styles.hint}>The picture could not be made on this device.</p>
      ) : picture ? (
        <>
          <img className={styles.preview} src={picture.url} alt="Today's calories, macros and meals" />
          <div className={styles.actions}>
            {canShareFile(picture.file) ? (
              <>
                <Button variant="primary" size="lg" onClick={() => void share()}>Share picture</Button>
                <Button variant="secondary" size="lg" onClick={save}>Save</Button>
              </>
            ) : (
              <Button variant="primary" size="lg" onClick={save}>Save picture</Button>
            )}
          </div>
          <p className={styles.hint}>Share opens your phone's share sheet: pick WhatsApp and the chat. It is drawn in light colours so it reads the same for everyone.</p>
        </>
      ) : (
        <div className={styles.previewWait}>Making the picture…</div>
      )}
    </Card>
  );
}
