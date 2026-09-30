import { APP_NAME } from "../../app/brand";
import { IconInfo, IconLeaf, IconShield } from "../../ui/icons";
import { MadeWithLove } from "../../ui/MadeWithLove";
import { Sheet } from "../../ui/Sheet";
import styles from "./profile.module.css";

const SECTIONS = [
  {
    icon: <IconLeaf />,
    title: "How the numbers work",
    text: "Every food has its calories and nutrients stored for a standard amount. When you pick a portion, the app scales them. Real values change with the recipe, the oil used and how big the portion really is, so treat the numbers as good estimates.",
  },
  {
    icon: <IconShield />,
    title: "Your data stays with you",
    text: "Everything you log is kept on this device. Nothing is sent anywhere. Export a backup from Profile any time to keep a copy.",
  },
  {
    icon: <IconInfo />,
    title: "Not medical advice",
    text: "This app is a tracking aid. For health conditions, or before a big change to how you eat, talk to a doctor or a dietitian.",
  },
];

export function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title={`About ${APP_NAME}`} subtitle={`Version ${__APP_VERSION__}`}>
      <div className={styles.about}>
        {SECTIONS.map((s) => (
          <section key={s.title} className={styles.aboutItem}>
            <span className={styles.aboutIcon} aria-hidden>{s.icon}</span>
            <div>
              <h3 className={styles.aboutTitle}>{s.title}</h3>
              <p className={styles.aboutText}>{s.text}</p>
            </div>
          </section>
        ))}
        <div className={styles.aboutCredit}><MadeWithLove /></div>
      </div>
    </Sheet>
  );
}
