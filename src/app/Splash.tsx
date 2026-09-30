import { useEffect } from "react";
import { QuoteText } from "../features/thought/QuoteText.tsx";
import { cx } from "../lib/cx";
import type { Quote } from "../quotes/types.ts";
import { BrandMark } from "../ui/BrandMark";
import { MadeWithLove } from "../ui/MadeWithLove";
import { APP_NAME } from "./brand";
import { THOUGHT_DELAY_MS } from "./useSplash.ts";
import styles from "./Splash.module.css";

const SKIP_KEYS = ["Enter", " ", "Escape"];

interface SplashProps {
  leaving: boolean;
  /** Today's thought, when this launch opens with one. Then a tap, Enter or Escape moves on. */
  thought: Quote | null;
  onSkip: () => void;
}

/** The opening moment: the mark pops in, the plus draws itself, the name rises. Some days a short thought follows. */
export function Splash({ leaving, thought, onSkip }: SplashProps) {
  useEffect(() => {
    if (!thought) return;
    const onKey = (event: KeyboardEvent) => {
      if (SKIP_KEYS.includes(event.key)) onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [thought, onSkip]);

  return (
    <div className={cx(styles.splash, leaving && styles.leaving, thought && styles.withThought)} aria-hidden={thought ? undefined : true} onClick={thought ? onSkip : undefined}>
      <div className={styles.center} aria-hidden>
        <BrandMark className={styles.mark} plusClassName={styles.plus} />
        <p className={styles.name}>{APP_NAME}</p>
      </div>
      {thought && (
        <div className={styles.thought} style={{ animationDelay: `${THOUGHT_DELAY_MS}ms` }}>
          <p className={styles.eyebrow}>Today's thought</p>
          <QuoteText quote={thought} className={styles.quote} />
          <button type="button" className={styles.next}>Continue</button>
        </div>
      )}
      <div className={styles.credit} aria-hidden>
        <MadeWithLove onBrand />
      </div>
    </div>
  );
}
