import { useEffect, useState, type ReactNode } from "react";
import { isFirefoxAndroid, isIos, isMobileDevice } from "../lib/device.ts";
import { BrandMark } from "../ui/BrandMark";
import { Button } from "../ui/Button";
import { IconAddToHome, IconBrowserShare, IconMenuDots, IconOffline, IconPhone, IconShield } from "../ui/icons";
import { Sheet } from "../ui/Sheet";
import { APP_NAME } from "./brand.ts";
import { installGuide, readSnoozedUntil, shouldOfferInstall, SHOW_AFTER_MS, snoozeInstall, type InstallGuide } from "./installNudge.ts";
import { isStandalone, useInstallPrompt } from "./installPrompt.ts";
import styles from "./InstallSheet.module.css";

const PERKS: { icon: ReactNode; text: string }[] = [
  { icon: <IconPhone />, text: "Opens full screen from your home screen" },
  { icon: <IconOffline />, text: "Works without internet" },
  { icon: <IconShield />, text: "Your food log stays on this phone" },
];

const STEPS: Record<InstallGuide, { icon: ReactNode; text: ReactNode }[]> = {
  ios: [
    { icon: <IconBrowserShare />, text: <>Tap <b>Share</b> in the browser bar</> },
    { icon: <IconAddToHome />, text: <>Choose <b>Add to Home Screen</b></> },
  ],
  menu: [
    { icon: <IconMenuDots />, text: <>Tap the browser <b>menu</b></> },
    { icon: <IconAddToHome />, text: <>Choose <b>Install</b> or <b>Add to Home screen</b></> },
  ],
};

/**
 * Asks anyone who opens the app in a phone's browser to install it. Where the browser has its own prompt the button
 * opens it; on iPhone and iPad, which have none, the two steps are shown instead. "Not now" is remembered for a few days.
 */
export function InstallSheet() {
  const install = useInstallPrompt();
  const [eligible] = useState(() => shouldOfferInstall({ standalone: isStandalone(), mobile: isMobileDevice(), snoozedUntil: readSnoozedUntil(), now: Date.now() }));
  const [due, setDue] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!eligible) return;
    const timer = window.setTimeout(() => setDue(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  // Android's Chrome sends its prompt only to an app that is not installed yet: with no prompt, and no steps to show, say nothing.
  const guide = install ? null : installGuide({ ios: isIos(), firefoxAndroid: isFirefoxAndroid() });
  if (!eligible || !due || !open || (!install && !guide)) return null;

  const later = () => {
    snoozeInstall();
    setOpen(false);
  };
  const add = async () => {
    if (!install) return;
    if ((await install()) === "dismissed") snoozeInstall();
    setOpen(false);
  };

  return (
    <Sheet
      open
      onClose={later}
      title={`Install ${APP_NAME}`}
      subtitle="Keep it on your phone, like any other app"
      footer={
        <div className={styles.actions}>
          {install ? (
            <>
              <Button variant="primary" size="lg" block onClick={() => void add()}>Install</Button>
              <Button variant="ghost" size="lg" block onClick={later}>Not now</Button>
            </>
          ) : (
            <Button variant="primary" size="lg" block onClick={later}>Got it</Button>
          )}
        </div>
      }
    >
      <div className={styles.body}>
        <span className={styles.logo} aria-hidden><BrandMark className={styles.mark} /></span>
        <ul className={styles.perks}>
          {PERKS.map((perk) => (
            <li key={perk.text}>
              <span className={styles.perkIcon} aria-hidden>{perk.icon}</span>
              {perk.text}
            </li>
          ))}
        </ul>
        {guide && (
          <ol className={styles.steps} aria-label="How to install">
            {STEPS[guide].map((step, i) => (
              <li key={i}>
                <span className={styles.number} aria-hidden>{i + 1}</span>
                <span className={styles.stepText}>{step.text}</span>
                <span className={styles.stepIcon} aria-hidden>{step.icon}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Sheet>
  );
}
