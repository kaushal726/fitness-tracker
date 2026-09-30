import { useState } from "react";
import { anotherQuote, quoteForDay } from "../../quotes/daily.ts";
import type { Quote } from "../../quotes/types.ts";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { IconQuote, IconShuffle } from "../../ui/icons";
import { QuoteText } from "./QuoteText.tsx";
import styles from "./ThoughtCard.module.css";

/** Today's thought, with a way to see another. Give it `key={today}` so a new day starts from that day's thought. */
export function ThoughtCard({ today }: { today: string }) {
  const [other, setOther] = useState<Quote | null>(null);
  const quote = other ?? quoteForDay(today);

  return (
    <Card tone="hero" className={styles.card}>
      <div className={styles.head}>
        <span className={styles.badge} aria-hidden><IconQuote /></span>
        <h2 className={styles.eyebrow}>{other ? "Another thought" : "Today's thought"}</h2>
      </div>
      <div aria-live="polite">
        <QuoteText quote={quote} className={styles.quote} />
      </div>
      <Button variant="outline" icon={<IconShuffle />} onClick={() => setOther(anotherQuote(quote.id))}>Show another</Button>
    </Card>
  );
}
