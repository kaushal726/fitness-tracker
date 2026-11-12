import { useId } from "react";
import { cx } from "../../lib/cx.ts";
import styles from "./WaterGlass.module.css";

/** The drawing is made on this grid; `size` scales it. */
const WIDTH = 48;
const HEIGHT = 56;
/** Where the water can be: from the glass's floor to just under its rim. */
const FLOOR = 52;
const BRIM = 8;
const GLASS = "M7 4h34l-3.4 44.6a4 4 0 0 1-4 3.7H14.4a4 4 0 0 1-4-3.7z";
/** Two wavelengths wider than the glass, so it can slide one wavelength sideways for ever. */
const WAVE = "M-24 0q6-3.2 12 0t12 0 12 0 12 0 12 0 12 0 12 0 12 0V60H-24z";

interface Props {
  /** How full, 0 to 1. */
  share: number;
  /** The width in pixels; the height follows. */
  size?: number;
  className?: string;
}

/** A glass that fills as the day's water adds up, with the surface moving a little. Decoration: the numbers are beside it. */
export function WaterGlass({ share, size = WIDTH, className }: Props) {
  const clipId = `glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const level = FLOOR - (FLOOR - BRIM) * Math.min(1, Math.max(0, share));
  return (
    <svg className={cx(styles.glass, className)} width={size} height={(size * HEIGHT) / WIDTH} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden>
      <defs>
        <clipPath id={clipId}><path d={GLASS} /></clipPath>
      </defs>
      <path className={styles.body} d={GLASS} />
      <g clipPath={`url(#${clipId})`}>
        <g className={styles.level} style={{ transform: `translateY(${level}px)` }}>
          <path className={cx(styles.wave, styles.back)} d={WAVE} />
          <path className={styles.wave} d={WAVE} />
        </g>
      </g>
      <path className={styles.rim} d={GLASS} />
    </svg>
  );
}
