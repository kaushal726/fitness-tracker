import { monthLabel, shiftMonth, type MonthId } from "../../domain/month.ts";
import { IconButton } from "../../ui/Button";
import { Button } from "../../ui/Button";
import { IconChevronLeft, IconChevronRight } from "../../ui/icons";
import styles from "./MonthSwitcher.module.css";

interface Props {
  month: MonthId;
  /** The month that is under way: the last one that can be shown. */
  current: MonthId;
  /** The first month with anything logged: nothing earlier is worth a visit. */
  earliest: MonthId;
  onChange: (month: MonthId) => void;
}

/** Previous and next month, and a way back to this one. */
export function MonthSwitcher({ month, current, earliest, onChange }: Props) {
  return (
    <nav className={styles.switcher} aria-label="Month">
      <IconButton label="Previous month" icon={<IconChevronLeft />} variant="soft" disabled={month <= earliest} onClick={() => onChange(shiftMonth(month, -1))} />
      <div className={styles.title}>
        <p className={styles.month} aria-live="polite">{monthLabel(month)}</p>
        {month !== current && <Button size="sm" variant="ghost" className={styles.back} onClick={() => onChange(current)}>Back to this month</Button>}
      </div>
      <IconButton label="Next month" icon={<IconChevronRight />} variant="soft" disabled={month >= current} onClick={() => onChange(shiftMonth(month, 1))} />
    </nav>
  );
}
