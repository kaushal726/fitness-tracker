import { useMemo } from "react";
import { convertQuantity, isMeasuredUnit, minQuantity, optionDisplayLabel, portionOptions, QUICK_AMOUNTS, quantityStep } from "../../domain/portions.ts";
import { formatNumber, formatQuantity, parseNumber } from "../../lib/format.ts";
import { cx } from "../../lib/cx.ts";
import { foodToGrams } from "../../nutrition/calculate.ts";
import type { Food } from "../../nutrition/types.ts";
import { Chip } from "../../ui/Chip";
import { IconMinus, IconPlus } from "../../ui/icons";
import styles from "./QuantityControl.module.css";

interface Props {
  food: Food;
  quantityText: string;
  unit: string;
  onQuantityText: (text: string) => void;
  onUnit: (unit: string) => void;
  autoFocus?: boolean;
}

/** How much: a stepper for the number, one-tap amounts for counted foods, chips for the unit, and the weight it comes to. */
export function QuantityControl({ food, quantityText, unit, onQuantityText, onUnit, autoFocus }: Props) {
  const options = useMemo(() => portionOptions(food), [food]);
  const quantity = parseNumber(quantityText);
  const valid = Number.isFinite(quantity) && quantity > 0;

  const grams = useMemo(() => {
    if (!valid || isMeasuredUnit(unit)) return null;
    try {
      return foodToGrams(food, quantity, unit);
    } catch {
      return null;
    }
  }, [food, quantity, unit, valid]);

  const nudge = (direction: 1 | -1) => {
    const base = Number.isFinite(quantity) ? quantity : 0;
    onQuantityText(formatQuantity(Math.max(minQuantity(unit), base + direction * quantityStep(unit))));
  };

  const changeUnit = (next: string) => {
    if (valid) onQuantityText(formatQuantity(convertQuantity(food, quantity, unit, next)));
    onUnit(next);
  };

  return (
    <div className={styles.control}>
      <div className={styles.stepper}>
        <button type="button" className={styles.step} aria-label="Less" onClick={() => nudge(-1)}><IconMinus aria-hidden /></button>
        <input
          className={styles.input}
          inputMode="decimal"
          aria-label="Quantity"
          value={quantityText}
          onChange={(e) => onQuantityText(e.target.value.replace(/[^\d.]/g, ""))}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus}
        />
        <button type="button" className={styles.step} aria-label="More" onClick={() => nudge(1)}><IconPlus aria-hidden /></button>
      </div>
      <p className={styles.grams} aria-live="polite">{grams !== null ? `About ${formatNumber(grams)} g` : " "}</p>
      {!isMeasuredUnit(unit) && (
        <div className={cx(styles.chips, styles.amounts)} role="radiogroup" aria-label="Quick amount">
          {QUICK_AMOUNTS.map((n) => (
            <Chip key={n} role="radio" selected={quantity === n} onClick={() => onQuantityText(formatQuantity(n))}>{n}</Chip>
          ))}
        </div>
      )}
      <div className={styles.chips} role="radiogroup" aria-label="Unit">
        {options.map((o) => (
          <Chip key={o.unit} role="radio" selected={o.unit === unit} onClick={() => changeUnit(o.unit)}>{optionDisplayLabel(o)}</Chip>
        ))}
      </div>
    </div>
  );
}
