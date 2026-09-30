import { useRef, useState } from "react";
import { APP_NAME } from "../../app/brand";
import { useInstallPrompt } from "../../app/installPrompt";
import { setThemeChoice, useThemeChoice, type ThemeChoice } from "../../app/theme";
import { backupFileName, parseBackup } from "../../data/backup.ts";
import { exportBackup, resetAll, restoreBackup, useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { computePlan, goalDef } from "../../domain/goals.ts";
import { formatHour, MEAL_ORDER } from "../../domain/meals.ts";
import { downloadBlob } from "../../lib/files.ts";
import { formatNumber } from "../../lib/format.ts";
import { Avatar } from "../../ui/Avatar";
import { useConfirm } from "../../ui/Confirm";
import { IconBook, IconClock, IconDownload, IconFlame, IconInfo, IconPalette, IconPhone, IconTarget, IconTrash, IconUpload } from "../../ui/icons";
import { MadeWithLove } from "../../ui/MadeWithLove";
import { Segmented } from "../../ui/Segmented";
import { SettingsGroup, SettingsRow } from "../../ui/SettingsList";
import { useToast } from "../../ui/Toast";
import { PlanPreview } from "../onboarding/PlanPreview.tsx";
import { AboutSheet } from "./AboutSheet.tsx";
import { CalorieTargetSheet } from "./CalorieTargetSheet.tsx";
import { DailyThought } from "./DailyThought.tsx";
import { EditProfileSheet } from "./EditProfileSheet.tsx";
import { MealTimesSheet } from "./MealTimesSheet.tsx";
import { MyFoodsSheet } from "./MyFoodsSheet.tsx";
import styles from "./profile.module.css";

type OpenSheet = "profile" | "target" | "meals" | "foods" | "about" | null;

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ProfileScreen({ profile, today }: { profile: Profile; today: string }) {
  const { settings, customFoods } = useAppState();
  const [open, setOpen] = useState<OpenSheet>(null);
  const theme = useThemeChoice();
  const install = useInstallPrompt();
  const confirm = useConfirm();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const plan = computePlan(profile, settings.customCalories);
  const close = () => setOpen(null);

  const exportData = () => {
    downloadBlob(new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" }), backupFileName());
    toast("Backup saved");
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) return toast("That file is not a backup from this app", { tone: "error" });
    const ok = await confirm({ title: "Replace your data?", message: "Everything in the app now is replaced by what is in the backup.", confirmLabel: "Replace" });
    if (!ok) return;
    restoreBackup(backup);
    toast("Backup restored");
  };

  const erase = async () => {
    const ok = await confirm({ title: "Erase all data?", message: "Your goal, your logs and your own foods are deleted from this device. This cannot be undone.", confirmLabel: "Erase everything", danger: true });
    if (ok) resetAll();
  };

  const mealTimes = MEAL_ORDER.map((m) => formatHour(settings.mealStartHours[m])).join(" · ");

  return (
    <>
      <div className={styles.layout}>
      <div className={styles.aside}>
        <header className={styles.who}>
          <Avatar name={profile.name} size={60} />
          <div className={styles.whoText}>
            <h1 className={styles.name}>{profile.name || "Your profile"}</h1>
            <p className={styles.meta}>{goalDef(profile.goal).label} · {profile.age} years · {Math.round(profile.weightKg * 10) / 10} kg</p>
          </div>
        </header>
        <PlanPreview plan={plan} requestedWeeks={profile.weeks} />
      </div>

      <div className={styles.main}>
      <SettingsGroup label="Your plan">
        <SettingsRow icon={<IconTarget />} tone="green" title="Goal and body" subtitle="Weight, goal, activity" onClick={() => setOpen("profile")} />
        <SettingsRow icon={<IconFlame />} tone="amber" title="Daily calories" subtitle={plan.custom ? "Set by you" : "Calculated for you"} value={`${formatNumber(plan.targets.calories)} kcal`} onClick={() => setOpen("target")} />
        <SettingsRow icon={<IconClock />} tone="blue" title="Meal times" subtitle={mealTimes} onClick={() => setOpen("meals")} />
        <SettingsRow icon={<IconBook />} tone="rose" title="My foods" subtitle="Foods you added yourself" value={customFoods.length ? String(customFoods.length) : undefined} onClick={() => setOpen("foods")} />
      </SettingsGroup>

      <SettingsGroup label="Appearance">
        <div className={styles.themeRow}>
          <div className={styles.themeHead}>
            <span className={styles.themeTile} aria-hidden><IconPalette /></span>
            <span className={styles.themeLabel}>Theme</span>
          </div>
          <Segmented label="Theme" value={theme} onChange={setThemeChoice} options={THEMES} />
        </div>
      </SettingsGroup>

      <SettingsGroup label="Your data">
        <SettingsRow icon={<IconDownload />} title="Export backup" subtitle="Save everything as a file" onClick={exportData} />
        <SettingsRow icon={<IconUpload />} title="Import backup" subtitle="Restore from a backup file" onClick={() => fileInput.current?.click()} />
        {install && <SettingsRow icon={<IconPhone />} title="Install app" subtitle="Add it to your home screen" onClick={() => void install()} />}
        <SettingsRow icon={<IconTrash />} title="Erase all data" subtitle="Start over on this device" danger onClick={erase} />
      </SettingsGroup>
      <input ref={fileInput} type="file" accept="application/json,.json" className={styles.hiddenInput} onChange={(e) => { void importData(e.target.files?.[0]); e.target.value = ""; }} />

      <SettingsGroup>
        <SettingsRow icon={<IconInfo />} title={`About ${APP_NAME}`} subtitle="How the numbers work, and your privacy" onClick={() => setOpen("about")} />
      </SettingsGroup>
      </div>
      </div>

      <footer className={styles.footer}>
        <DailyThought today={today} />
        <MadeWithLove />
        <p className={styles.version}>{APP_NAME} · Version {__APP_VERSION__}</p>
      </footer>

      {open === "profile" && <EditProfileSheet profile={profile} onClose={close} />}
      {open === "target" && <CalorieTargetSheet profile={profile} settings={settings} onClose={close} />}
      {open === "meals" && <MealTimesSheet settings={settings} onClose={close} />}
      {open === "foods" && <MyFoodsSheet onClose={close} />}
      {open === "about" && <AboutSheet onClose={close} />}
    </>
  );
}
