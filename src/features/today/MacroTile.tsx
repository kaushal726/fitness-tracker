import { useAnimatesIn } from "../../lib/arrival.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { CountUp } from "../../ui/CountUp";
import { IconAlert, IconCheck, IconChevronRight } from "../../ui/icons";
import { Ring, type RingTone } from "../../ui/Ring";
import styles from "./MacroTile.module.css";

const RING_SIZE = 46;
const RING_STROKE = 5;

export interface MacroAlert {
  /** A few words on what is off: "123 g short". */
  text: string;
  /** Given when there are foods that would help: the tile opens them. */
  onOpen?: () => void;
}

interface Props {
  label: string;
  tone: Extract<RingTone, "protein" | "carbs" | "fat" | "fiber">;
  /** Grams eaten. */
  value: number;
  /** Grams the day asks for. */
  target: number;
  /** Something about this nutrient worth a look: the tile says so in its own place and can open help. */
  alert?: MacroAlert;
}

/** One nutrient on a tile of its own colour: how far it is toward its goal in a small ring (a tick once it is reached), and the grams beside it. */
export function MacroTile({ label, tone, value, target, alert }: Props) {
  const animates = useAnimatesIn();
  const share = target > 0 ? value / target : 0;
  const reached = share >= 1;
  const content = (
    <>
      <Ring value={value} max={target} size={RING_SIZE} stroke={RING_STROKE} tone={tone} label={`${label}: ${formatNumber(value)} of ${formatNumber(target)} grams`}>
        {reached ? <IconCheck className={cx(styles.check, animates && "motion-pop")} aria-hidden /> : <span className={cx(styles.percent, "num")}>{Math.min(99, Math.floor(share * 100))}%</span>}
      </Ring>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={cx(styles.value, "num")}>
          <CountUp value={value} />
          <small> / {formatNumber(target)} g</small>
        </span>
        {alert && (
          <span className={cx(styles.alertText, "num")}>
            <IconAlert aria-hidden /> {alert.text}
          </span>
        )}
      </span>
      {alert?.onOpen && <IconChevronRight className={styles.more} aria-hidden />}
    </>
  );
  return (
    <li className={cx(styles.tile, styles[tone], alert && styles.alert)}>
      {alert?.onOpen ? (
        <button type="button" className={styles.inner} onClick={alert.onOpen} aria-haspopup="dialog" aria-label={`${label}: ${alert.text}. See foods that help`}>{content}</button>
      ) : (
        <span className={styles.inner}>{content}</span>
      )}
    </li>
  );
}
