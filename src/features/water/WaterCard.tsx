import type { CSSProperties } from "react";
import { formatVolume } from "../../domain/water.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { IconCheck, IconMinus, IconPlus } from "../../ui/icons";
import { glassCount } from "./glassCount.ts";
import type { DayWater } from "./useWater.ts";
import { WaterGlass } from "./WaterGlass.tsx";
import styles from "./WaterCard.module.css";

interface Props {
  water: DayWater;
  /** Its place on the page: it arrives after what is above it. */
  index: number;
  /** Opens the water sheet: bigger amounts, the goal, the week. */
  onOpen: () => void;
}

/** The day's water on one line: a glass that fills, how much so far, and one tap to add a glass or take one back. */
export function WaterCard({ water, index, onOpen }: Props) {
  const animates = useAnimatesIn();
  const { ml, trackedMl, goalMl, glassMl, glasses, share, reached, add } = water;
  return (
    <section className={cx(styles.card, animates && "motion-rise")} style={{ "--i": index } as CSSProperties} aria-label="Water">
      <button type="button" className={styles.open} onClick={onOpen} aria-label="Water: open for more">
        <WaterGlass share={share} size={40} />
        <span className={styles.text}>
          <span className={styles.label}>
            Water
            {reached && <span className={styles.reached}><IconCheck aria-hidden /> Goal reached</span>}
          </span>
          <span key={ml} className={cx(styles.value, "num", animates && ml > 0 && "motion-bump")}>{glassCount(glasses)}</span>
          <span className={cx(styles.sub, "num")}>{formatVolume(ml)} of {formatVolume(goalMl)}</span>
        </span>
      </button>
      <button type="button" className={styles.minus} onClick={() => add(-glassMl)} disabled={trackedMl <= 0} aria-label="Take one glass back" title="Take one glass back">
        <IconMinus aria-hidden />
      </button>
      <button type="button" className={styles.plus} onClick={() => add(glassMl)} aria-label="Add one glass" title="Add one glass">
        <IconPlus aria-hidden />
      </button>
    </section>
  );
}
