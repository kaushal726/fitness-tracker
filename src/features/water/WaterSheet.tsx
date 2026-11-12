import { useMemo } from "react";
import { saveSettings, useAppState } from "../../data/store.ts";
import { BOTTLE_ML, clampWaterGoal, formatVolume, GLASS_SIZES_ML, glassesOf, LARGE_BOTTLE_ML, MAX_WATER_GOAL_ML, MIN_WATER_GOAL_ML, WATER_GOAL_STEP_ML, waterByDate } from "../../domain/water.ts";
import { formatDayLabel } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { Button, IconButton } from "../../ui/Button";
import { IconCheck, IconDrops, IconMinus, IconPlus, IconUndo, IconWater } from "../../ui/icons";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";
import { glassCount } from "./glassCount.ts";
import { useWater } from "./useWater.ts";
import { WaterGlass } from "./WaterGlass.tsx";
import { WaterWeek } from "./WaterWeek.tsx";
import styles from "./WaterSheet.module.css";

interface Props {
  /** The day the water is added to. */
  date: string;
  onClose: () => void;
}

const PERCENT = 100;
const GLASS_OPTIONS = GLASS_SIZES_ML.map((ml) => ({ value: String(ml), label: `${ml} ml` }));

/** Everything about water in one place: the day so far, bigger amounts in one tap, the last week, the goal and the glass. */
export function WaterSheet({ date, onClose }: Props) {
  const { water: log, entries } = useAppState();
  const water = useWater(date);
  const { ml, trackedMl, goalMl, glassMl, glasses, share, reached, add } = water;
  const byDate = useMemo(() => waterByDate(log, entries), [log, entries]);
  const setGoal = (next: number) => saveSettings({ waterGoalMl: clampWaterGoal(next) });

  const amounts = [
    { label: "Glass", ml: glassMl, icon: <IconWater /> },
    { label: "Bottle", ml: BOTTLE_ML, icon: <IconDrops /> },
    { label: "Big bottle", ml: LARGE_BOTTLE_ML, icon: <IconDrops /> },
  ];

  return (
    <Sheet open onClose={onClose} title="Water" subtitle={formatDayLabel(date)}>
      <div className={styles.body}>
        <div className={styles.now}>
          <WaterGlass share={share} size={104} />
          <div className={styles.nowText} aria-live="polite">
            <p className={cx(styles.count, "num")}>{glassCount(glasses)}</p>
            <p className={cx(styles.volume, "num")}>{formatVolume(ml)} of {formatVolume(goalMl)}</p>
            <p className={cx(styles.status, reached && styles.done)}>
              {reached ? <><IconCheck aria-hidden /> Goal reached</> : `${Math.round(share * PERCENT)}% of your goal`}
            </p>
          </div>
        </div>

        <div className={styles.amounts}>
          {amounts.map((a) => (
            <button key={a.label} type="button" className={styles.amount} onClick={() => add(a.ml)}>
              <span className={styles.amountIcon} aria-hidden>{a.icon}</span>
              <span className={styles.amountLabel}>{a.label}</span>
              <span className={cx(styles.amountMl, "num")}>+{formatVolume(a.ml)}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" icon={<IconUndo />} className={styles.undo} disabled={trackedMl <= 0} onClick={() => add(-Math.min(glassMl, trackedMl))}>Take one glass back</Button>

        <section className={styles.section} aria-label="Last 7 days">
          <h3 className={styles.heading}>Last 7 days</h3>
          <WaterWeek until={date} byDate={byDate} goalMl={goalMl} />
        </section>

        <section className={styles.section} aria-label="Daily goal">
          <h3 className={styles.heading}>Daily goal</h3>
          <div className={styles.stepper}>
            <IconButton label="Less" icon={<IconMinus />} variant="secondary" disabled={goalMl <= MIN_WATER_GOAL_ML} onClick={() => setGoal(goalMl - WATER_GOAL_STEP_ML)} />
            <p className={styles.goal} aria-live="polite">
              <span className={cx(styles.goalValue, "num")}>{formatVolume(goalMl)}</span>
              <span className={cx(styles.goalGlasses, "num")}>about {glassCount(Math.round(glassesOf(goalMl, glassMl)))}</span>
            </p>
            <IconButton label="More" icon={<IconPlus />} variant="secondary" disabled={goalMl >= MAX_WATER_GOAL_ML} onClick={() => setGoal(goalMl + WATER_GOAL_STEP_ML)} />
          </div>
        </section>

        <section className={styles.section} aria-label="Glass size">
          <h3 className={styles.heading}>Your glass</h3>
          <Segmented label="Glass size" value={String(glassMl)} onChange={(value) => saveSettings({ waterGlassMl: Number(value) })} options={GLASS_OPTIONS} />
        </section>
      </div>
    </Sheet>
  );
}
