import { BMI_BANDS, bmiBand } from "../../domain/bmi.ts";
import { cx } from "../../lib/cx.ts";
import styles from "./BmiScale.module.css";

interface Props {
  value: number;
  /** The BMI the target weight would give, drawn as a second tick. */
  target: number | null;
}

/** The scale runs from here to here; a BMI outside it sits at the edge. */
const FROM = 15;
const TO = 40;
const BAND_ENDS = [18.5, 25, 30, TO];

const share = (bmi: number): number => Math.min(1, Math.max(0, (bmi - FROM) / (TO - FROM)));

/** The four bands side by side, with a marker where this BMI falls. Names sit under the bands: colour is never the only cue. */
export function BmiScale({ value, target }: Props) {
  return (
    <div className={styles.scale} role="img" aria-label={`BMI ${value.toFixed(1)}: ${bmiBand(value).label}`}>
      <div className={styles.bar}>
        {BMI_BANDS.map((band, i) => (
          <span key={band.id} className={cx(styles.band, styles[band.id])} style={{ flexGrow: BAND_ENDS[i] - (i === 0 ? FROM : BAND_ENDS[i - 1]) }} />
        ))}
        {target !== null && <span className={styles.target} style={{ left: `${share(target) * 100}%` }} title="Your target" />}
        <span className={styles.marker} style={{ left: `${share(value) * 100}%` }} />
      </div>
      <div className={styles.names} aria-hidden>
        {BMI_BANDS.map((band, i) => (
          <span key={band.id} className={cx(styles.name, band.id === bmiBand(value).id && styles.current)} style={{ flexGrow: BAND_ENDS[i] - (i === 0 ? FROM : BAND_ENDS[i - 1]) }}>
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
