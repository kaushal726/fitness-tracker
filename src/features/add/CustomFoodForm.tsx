import { useRef, useState, type FormEvent } from "react";
import { addCustomFood } from "../../data/store.ts";
import { parseNumber } from "../../lib/format.ts";
import { uid } from "../../lib/ids.ts";
import { useScrollTop } from "../../lib/useScrollTop.ts";
import { createCustomFood, CUSTOM_ID_PREFIX } from "../../nutrition/custom.ts";
import type { Food } from "../../nutrition/types.ts";
import { Button } from "../../ui/Button";
import { TextField } from "../../ui/Field";
import styles from "./CustomFoodForm.module.css";

interface Props {
  /** What they had typed in search, so they do not type it twice. */
  initialName: string;
  onCreated: (food: Food) => void;
}

const DEFAULT_SERVING = "1 serving";
const MAX_CALORIES = 5000;
const MAX_GRAMS = 500;

/** Only calories are required; a missing macro is treated as zero. */
function optionalNumber(text: string): number {
  const n = parseNumber(text);
  return Number.isNaN(n) ? 0 : n;
}

/** The fallback when a food is missing from the dataset. A view of the add page, not a sheet of its own. */
export function CustomFoodForm({ initialName, onCreated }: Props) {
  const [name, setName] = useState(initialName);
  const [serving, setServing] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [tried, setTried] = useState(false);
  const top = useRef<HTMLFormElement>(null);
  useScrollTop(top);

  const kcal = parseNumber(calories);
  const macros = [protein, carbs, fat, fiber].map(optionalNumber);
  const kcalOk = kcal >= 0 && kcal <= MAX_CALORIES;
  const macrosOk = macros.every((m) => m >= 0 && m <= MAX_GRAMS);

  const save = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || !kcalOk || !macrosOk) return;
    const [p, c, f, fi] = macros;
    const food = createCustomFood({
      id: `${CUSTOM_ID_PREFIX}${uid()}`,
      name: name.trim(),
      servingLabel: serving.trim() || DEFAULT_SERVING,
      calories: kcal,
      protein: p,
      carbs: c,
      fat: f,
      fiber: fi,
    });
    addCustomFood(food);
    onCreated(food);
  };

  return (
    <form ref={top} onSubmit={save} noValidate>
      <TextField label="Food name" value={name} onChange={setName} error={tried && !name.trim() ? "Enter a name" : undefined} placeholder="Amma's sambar" autoFocus />
      <TextField label="One serving is" optional value={serving} onChange={setServing} placeholder="1 bowl" />
      <TextField label="Calories" inputMode="decimal" value={calories} onChange={setCalories} suffix="kcal" error={tried && !kcalOk ? "Enter the calories" : undefined} placeholder="150" />
      <div className={styles.grid}>
        <TextField label="Protein" optional inputMode="decimal" value={protein} onChange={setProtein} suffix="g" />
        <TextField label="Carbs" optional inputMode="decimal" value={carbs} onChange={setCarbs} suffix="g" />
        <TextField label="Fat" optional inputMode="decimal" value={fat} onChange={setFat} suffix="g" />
        <TextField label="Fiber" optional inputMode="decimal" value={fiber} onChange={setFiber} suffix="g" error={tried && !macrosOk ? "Check the grams" : undefined} />
      </div>
      <Button type="submit" variant="primary" size="lg" block className={styles.save}>Save food</Button>
    </form>
  );
}
