import { cx } from "../../lib/cx.ts";
import type { Quote } from "../../quotes/types.ts";
import styles from "./QuoteText.module.css";

interface QuoteTextProps {
  quote: Pick<Quote, "text" | "by" | "gloss">;
  /** Sets the size and colour of the line; the translation and the name follow it. */
  className?: string;
}

/** A quote, its English rendering when it is in another language, and who said it. Colours come from the parent. */
export function QuoteText({ quote, className }: QuoteTextProps) {
  return (
    <figure className={cx(styles.quote, className)}>
      <blockquote className={styles.text}>{quote.text}</blockquote>
      {quote.gloss && <p className={styles.gloss}>{quote.gloss}</p>}
      {quote.by && <figcaption className={styles.by}>{quote.by}</figcaption>}
    </figure>
  );
}
