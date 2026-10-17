import { useEffect, useMemo, useState } from "react";
import { accentOf, useAccent } from "../../app/accent.ts";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { dayReport } from "../../domain/dayReport.ts";
import { computePlan, goalDef } from "../../domain/goals.ts";
import { formatDayLabel } from "../../lib/dates.ts";
import { downloadBlob } from "../../lib/files.ts";
import { canShareFile, shareOrSave } from "../../lib/share.ts";
import { Button } from "../../ui/Button";
import { Segmented } from "../../ui/Segmented";
import { Card } from "../../ui/Card";
import { useToast } from "../../ui/Toast";
import { renderDayImage } from "./renderDayImage.ts";
import styles from "./ShareSheet.module.css";

interface Props {
  profile: Profile;
  /** The day to share. */
  date: string;
  /** False when a sheet around the card already says what it is. */
  showHead?: boolean;
}

type Scope = "foods" | "numbers";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "foods", label: "With foods" },
  { value: "numbers", label: "Numbers only" },
];

const DAY_NAME: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };

interface Picture {
  file: File;
  url: string;
}

/** A day as a picture: calories against the goal, the macros and each meal, ready to send to a trainer or a group. */
export function ShareDayCard({ profile, date, showHead = true }: Props) {
  const { entries, settings } = useAppState();
  const toast = useToast();
  const report = useMemo(() => dayReport(entries, computePlan(profile, settings.customCalories).targets, date), [entries, profile, settings.customCalories, date]);
  const [picture, setPicture] = useState<Picture | null>(null);
  const [failed, setFailed] = useState(false);
  const [scope, setScope] = useState<Scope>("foods");
  const dayName = formatDayLabel(date, DAY_NAME);
  const primary = accentOf(useAccent()).color;

  useEffect(() => {
    setPicture(null);
    setFailed(false);
    if (report.itemCount === 0) return;
    let cancelled = false;
    let url = "";
    renderDayImage(report, { name: profile.name, goalLabel: goalDef(profile.goal).label }, { withFoods: scope === "foods", primary })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPicture({ file: new File([blob], `eatright-${date}.png`, { type: "image/png" }), url });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [report, profile.name, profile.goal, date, scope, primary]);

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
    <Card className={styles.card} role="region" aria-label={`${dayName} as a picture`}>
      {showHead && (
        <header className={styles.head}>
          <h3 className={styles.title}>{dayName}</h3>
          <p className={styles.lead}>A picture for your trainer or group</p>
        </header>
      )}
      {report.itemCount === 0 ? (
        <p className={styles.hint}>Nothing is logged for this day yet. Add what you ate and the picture is made from it.</p>
      ) : failed ? (
        <p className={styles.hint}>The picture could not be made on this device.</p>
      ) : picture ? (
        <>
          <Segmented label="What to share" value={scope} onChange={setScope} options={SCOPES} />
          <p className={styles.hint}>{scope === "foods" ? "Calories, macros and each food you ate." : "Calories, macros and the total of each meal. No food names."}</p>
          <img className={styles.preview} src={picture.url} alt="Calories, macros and meals of the day" />
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
          <p className={styles.hint}>Share opens your phone's share sheet: pick WhatsApp and the chat.</p>
        </>
      ) : (
        <div className={styles.previewWait}>Making the picture…</div>
      )}
    </Card>
  );
}
