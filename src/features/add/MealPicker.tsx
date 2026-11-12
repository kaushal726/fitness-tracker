import { useRef, useState } from "react";
import { useAppState } from "../../data/store.ts";
import { formatHour, MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import type { MealType } from "../../nutrition/types.ts";
import { IconChevronDown } from "../../ui/icons";
import { Menu, type MenuOption } from "../../ui/Menu";
import { MealIcon } from "../meals/MealIcon.tsx";
import styles from "./MealPicker.module.css";

interface Props {
  value: MealType;
  onChange: (meal: MealType) => void;
}

/** "Adding to Dinner": says where foods go and lets that change, from a small menu that is not a sheet. */
export function MealPicker({ value, onChange }: Props) {
  const { settings } = useAppState();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const starts = settings.mealStartHours;
  const options: MenuOption<MealType>[] = MEAL_ORDER.map((m, i) => ({
    value: m,
    label: MEAL_LABELS[m],
    icon: <MealIcon meal={m} size="sm" />,
    hint: `From ${formatHour(starts[m])} to ${formatHour(starts[MEAL_ORDER[(i + 1) % MEAL_ORDER.length]])}`,
  }));

  return (
    <>
      <button ref={triggerRef} type="button" className={cx(styles.trigger, open && styles.open)} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MealIcon meal={value} size="sm" className={styles.icon} />
        <span className={styles.text}>Adding to <strong>{MEAL_LABELS[value]}</strong></span>
        <IconChevronDown className={styles.chevron} aria-hidden />
      </button>
      {open && <Menu anchor={triggerRef} options={options} value={value} label="Meal" onPick={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}
