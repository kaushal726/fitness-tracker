import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { CountUp } from "../../ui/CountUp";
import { IconCheck } from "../../ui/icons";
import { Ring, type RingTone } from "../../ui/Ring";
import styles from "./MacroTile.module.css";

const RING_SIZE = 46;
const RING_STROKE = 5;

interface Props {
  label: string;
  tone: Extract<RingTone, "protein" | "carbs" | "fat" | "fiber">;
  /** Grams eaten. */
  value: number;
  /** Grams the day asks for. */
  target: number;
}

/** One nutrient: how far it is toward its goal in a small ring (a tick once it is reached), and the grams beside it. */
export function MacroTile({ label, tone, value, target }: Props) {
  const animates = useAnimatesIn();
  const share = target > 0 ? value / target : 0;
  const reached = share >= 1;
  return (
    <li className={styles.tile}>
      <Ring value={value} max={target} size={RING_SIZE} stroke={RING_STROKE} tone={tone} label={`${label}: ${formatNumber(value)} of ${formatNumber(target)} grams`}>
        {reached ? <IconCheck className={cx(styles.check, styles[tone], animates && "motion-pop")} aria-hidden /> : <span className={cx(styles.percent, "num")}>{Math.min(99, Math.floor(share * 100))}%</span>}
      </Ring>
      <span className={cx(styles.label, styles[tone])}>{label}</span>
      <span className={cx(styles.value, "num")}>
        <CountUp value={value} />
        <small> / {formatNumber(target)} g</small>
      </span>
    </li>
  );
}
