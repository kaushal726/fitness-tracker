import { useEffect, useRef, useState } from "react";
import { useBackLayer } from "../../app/useBackLayer.ts";
import { MEAL_LABELS, MEAL_ORDER } from "../../domain/meals.ts";
import { cx } from "../../lib/cx.ts";
import type { MealType } from "../../nutrition/types.ts";
import { IconCheck, IconChevronDown } from "../../ui/icons";
import styles from "./MealPicker.module.css";

interface Props {
  value: MealType;
  onChange: (meal: MealType) => void;
}

/** "Adding to Dinner ▾": says where foods go and lets that change, from a small menu that is not a sheet. */
export function MealPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  useBackLayer(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span ref={rootRef} className={styles.root}>
      <button type="button" className={styles.trigger} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Adding to <strong>{MEAL_LABELS[value]}</strong>
        <IconChevronDown className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden />
      </button>
      {open && (
        <div className={styles.menu} role="radiogroup" aria-label="Meal">
          {MEAL_ORDER.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === value}
              className={styles.option}
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
            >
              {MEAL_LABELS[m]}
              {m === value && <IconCheck aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
