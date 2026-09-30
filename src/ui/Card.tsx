import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "hero" is the tinted card that leads a screen. */
  tone?: "default" | "hero";
  padded?: boolean;
}

export function Card({ tone = "default", padded = true, className, ...rest }: CardProps) {
  return <div className={cx(styles.card, tone === "hero" && styles.hero, padded && styles.padded, className)} {...rest} />;
}
