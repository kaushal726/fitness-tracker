import { useMemo, useRef, useState, type FormEvent } from "react";
import { addCustomFood, updateCustomFood, useAppState } from "../../data/store.ts";
import { parseNumber } from "../../lib/format.ts";
import { uid } from "../../lib/ids.ts";
import { useScrollTop } from "../../lib/useScrollTop.ts";
import { createCustomFood, CUSTOM_ID_PREFIX } from "../../nutrition/custom.ts";
import { searchFood } from "../../nutrition/index.ts";
import { normalizeForSearch } from "../../nutrition/text.ts";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { IconChevronDown } from "../../ui/icons";
import { SelectField, TextField } from "../../ui/Field";
import styles from "./CustomFoodForm.module.css";

interface Props {
  /** What they had typed in search, so they do not type it twice. */
  initialName: string;
  /** A food of their own to change: its numbers fill the form, and saving replaces it. */
  editing?: Food;
  onCreated: (food: Food) => void;
  /** They typed the name of a food that is already in the list: go to its amount instead of making a copy. Left out where there is no amount page to go to. */
  onUseExisting?: (food: Food) => void;
}

const DEFAULT_SERVING = "1 serving";
const SERVINGS = [DEFAULT_SERVING, "1 katori", "1 bowl", "1 cup", "1 glass", "1 plate", "1 piece", "1 slice", "1 tbsp", "1 tsp", "100 g", "100 ml"];
const MAX_CALORIES = 5000;
const MAX_GRAMS = 500;
const MAX_SODIUM_MG = 20000;
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;
/** Calories further than this from what the protein, carbs and fat add up to are worth a second look. */
const MISMATCH_SHARE = 0.25;
const MISMATCH_MIN_KCAL = 40;
/** Sugar is part of the carbs; a little over is rounding. */
const SUGAR_SLACK_G = 0.5;

/** A number for a field: empty for zero or nothing, one decimal otherwise. */
const fieldText = (n: number | undefined): string => (n ? String(Math.round(n * 10) / 10) : "");

/** Only calories are required; a missing nutrient is treated as zero. */
function optionalNumber(text: string): number {
  const n = parseNumber(text);
  return Number.isNaN(n) ? 0 : n;
}

/** The fallback when a food is missing from the dataset: a name and its calories, and the rest only if they want it. */
export function CustomFoodForm({ initialName, editing, onCreated, onUseExisting }: Props) {
  const { customFoods } = useAppState();
  const per = editing?.nutritionPer100g;
  const [name, setName] = useState(editing?.name ?? initialName);
  const [serving, setServing] = useState(editing?.servingOptions[0]?.label ?? DEFAULT_SERVING);
  const [calories, setCalories] = useState(fieldText(per?.calories));
  const [protein, setProtein] = useState(fieldText(per?.protein));
  const [carbs, setCarbs] = useState(fieldText(per?.carbohydrates));
  const [fat, setFat] = useState(fieldText(per?.fat));
  const [fiber, setFiber] = useState(fieldText(per?.fiber));
  const [sugar, setSugar] = useState(fieldText(per?.sugar));
  const [sodium, setSodium] = useState(fieldText(per?.sodium));
  const [more, setMore] = useState(Boolean(per && (per.protein || per.carbohydrates || per.fat || per.fiber || per.sugar || per.sodium)));
  const [tried, setTried] = useState(false);
  const top = useRef<HTMLFormElement>(null);
  useScrollTop(top);

  const sameFood = useMemo(() => {
    const wanted = normalizeForSearch(name);
    return wanted ? searchFood(wanted, { limit: 5, extraFoods: customFoods }).find((f) => f.id !== editing?.id && normalizeForSearch(f.name) === wanted) : undefined;
  }, [name, customFoods, editing?.id]);

  const kcal = parseNumber(calories);
  const grams = [protein, carbs, fat, fiber, sugar].map(optionalNumber);
  const mg = optionalNumber(sodium);
  const kcalOk = kcal >= 0 && kcal <= MAX_CALORIES;
  const gramsOk = grams.every((g) => g >= 0 && g <= MAX_GRAMS);
  const sugarOk = grams[4] <= grams[1] + SUGAR_SLACK_G || grams[1] === 0;
  const sodiumOk = mg >= 0 && mg <= MAX_SODIUM_MG;

  const macroKcal = grams[0] * KCAL_PER_G.protein + grams[1] * KCAL_PER_G.carbs + grams[2] * KCAL_PER_G.fat;
  const mismatch = macroKcal > 0 && kcal > 0 && Math.abs(macroKcal - kcal) > Math.max(MISMATCH_MIN_KCAL, kcal * MISMATCH_SHARE);
  const servings = SERVINGS.includes(serving) ? SERVINGS : [serving, ...SERVINGS];

  const save = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!gramsOk || !sugarOk || !sodiumOk) setMore(true);
    if (!name.trim() || !kcalOk || !gramsOk || !sugarOk || !sodiumOk) return;
    const [p, c, f, fi, su] = grams;
    const food = createCustomFood({ id: editing?.id ?? `${CUSTOM_ID_PREFIX}${uid()}`, name: name.trim(), servingLabel: serving, calories: kcal, protein: p, carbs: c, fat: f, fiber: fi, sugar: su, sodium: mg });
    if (editing) updateCustomFood(food);
    else addCustomFood(food);
    onCreated(food);
  };

  return (
    <form ref={top} onSubmit={save} noValidate>
      <TextField
        label="Food name"
        value={name}
        onChange={setName}
        error={tried && !name.trim() ? "Enter a name" : undefined}
        hint={sameFood && (
          <>
            This food is already in the list.
            {onUseExisting && <>{" "}<button type="button" className={styles.use} onClick={() => onUseExisting(sameFood)}>Use it</button></>}
          </>
        )}
        placeholder="Amma's sambar"
        autoFocus={!name.trim()}
      />
      <div className={styles.pair}>
        <TextField label="Calories" inputMode="decimal" value={calories} onChange={setCalories} suffix="kcal" error={tried && !kcalOk ? "Enter the calories" : undefined} placeholder="150" autoFocus={Boolean(name.trim())} />
        <SelectField label="In one" value={serving} onChange={setServing} options={servings.map((v) => ({ value: v, label: v }))} />
      </div>
      {mismatch && <p className={styles.note}>Your protein, carbs and fat add up to about {Math.round(macroKcal)} kcal.</p>}

      <details className={styles.more} open={more} onToggle={(e) => setMore(e.currentTarget.open)}>
        <summary>More details <IconChevronDown aria-hidden /></summary>
        <div className={styles.grid}>
          <TextField label="Protein" optional inputMode="decimal" value={protein} onChange={setProtein} suffix="g" />
          <TextField label="Carbs" optional inputMode="decimal" value={carbs} onChange={setCarbs} suffix="g" />
          <TextField label="Fat" optional inputMode="decimal" value={fat} onChange={setFat} suffix="g" />
          <TextField label="Fiber" optional inputMode="decimal" value={fiber} onChange={setFiber} suffix="g" error={tried && !gramsOk ? "Check the grams" : undefined} />
          <TextField label="Sugar" optional inputMode="decimal" value={sugar} onChange={setSugar} suffix="g" error={tried && !sugarOk ? "More than the carbs" : undefined} />
          <TextField label="Sodium" optional inputMode="decimal" value={sodium} onChange={setSodium} suffix="mg" error={tried && !sodiumOk ? "Check the mg" : undefined} />
        </div>
      </details>

      <Button type="submit" variant="primary" size="lg" block className={styles.save}>{editing ? "Save changes" : "Save food"}</Button>
    </form>
  );
}
