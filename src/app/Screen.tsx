import type { ReactNode } from "react";
import { useAnimatesIn } from "../lib/arrival.ts";
import { cx } from "../lib/cx.ts";
import styles from "./Screen.module.css";

/** One tab's page. It fades in when it appears, except the first one on a reloaded page. */
export function Screen({ children }: { children: ReactNode }) {
  const animated = useAnimatesIn();
  return <div className={cx(styles.content, animated && styles.enter)}>{children}</div>;
}
