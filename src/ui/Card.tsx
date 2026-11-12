import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "lead" is the bold card that opens a screen, in the accent (the --hero-* tokens). */
  tone?: "default" | "lead";
  padded?: boolean;
}

export function Card({ tone = "default", padded = true, className, ...rest }: CardProps) {
  return <div className={cx(styles.card, tone === "lead" && styles.lead, padded && styles.padded, className)} {...rest} />;
}
