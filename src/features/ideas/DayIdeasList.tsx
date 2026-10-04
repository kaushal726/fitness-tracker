import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { DayGap, DayIdeas, Idea } from "../../domain/ideas.ts";
import { formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconPlus } from "../../ui/icons";
import { ProgressBar, type BarTone } from "../../ui/ProgressBar";
import { FoodTile } from "../add/FoodTile.tsx";
import styles from "./DayIdeasList.module.css";

interface Props {
  groups: DayIdeas[];
  /** The idea that was chosen: the person goes on to say how much. */
  onPick: (food: Food) => void;
  /** The short form for a page that has other things to show: the foods as chips, not rows. */
  compact?: boolean;
}

const NAMES = { protein: "protein", fiber: "fibre", calories: "calories" } as const;
const TONES: Record<DayGap["nutrient"], BarTone> = { protein: "protein", fiber: "fiber", calories: "over" };
const UNITS = { protein: "g", fiber: "g", calories: "kcal" } as const;

function headline(gap: DayGap): string {
  const amount = formatNumber(gap.amount);
  return gap.kind === "over" ? `${amount} kcal over your goal` : `${gap.nutrient === "fiber" ? "Fibre" : "Protein"} is ${amount} g short`;
}

function IdeaRow({ idea, gap, onPick }: { idea: Idea; gap: DayGap; onPick: (food: Food) => void }) {
  const serving = idea.food.servingOptions[0];
  return (
    <li>
      <button type="button" className={styles.row} onClick={() => onPick(idea.food)} aria-label={`Add ${idea.food.name}`}>
        <FoodTile category={idea.food.category} />
        <span className={styles.text}>
          <span className={styles.name}>{idea.food.name}</span>
          <span className={styles.meta}>{formatNumber(idea.calories)} kcal{serving ? ` · ${formatPortionText(serving.label)}` : ""}</span>
        </span>
        {gap.kind === "short" && idea.adds > 0 && <span className={styles.adds}>+{formatNumber(idea.adds)} g</span>}
        <span className={styles.add} aria-hidden><IconPlus /></span>
      </button>
    </li>
  );
}

function IdeaChip({ idea, gap, onPick }: { idea: Idea; gap: DayGap; onPick: (food: Food) => void }) {
  return (
    <li>
      <button type="button" className={styles.chip} onClick={() => onPick(idea.food)} aria-label={`Add ${idea.food.name}`}>
        {idea.food.name}
        {gap.kind === "short" && idea.adds > 0 && <span className={styles.adds}>+{formatNumber(idea.adds)} g</span>}
      </button>
    </li>
  );
}

/** What is off about the day, drawn as a bar, and a few foods under it that would put it right. */
export function DayIdeasList({ groups, onPick, compact }: Props) {
  return (
    <div className={styles.groups}>
      {groups.map(({ gap, foods }) => (
        <section key={gap.nutrient} className={styles.group} aria-label={headline(gap)}>
          <header className={styles.head}>
            <p className={styles.title}>{headline(gap)}</p>
            <p className={styles.sub}>
              {formatNumber(gap.eaten)} of {formatNumber(gap.goal)} {UNITS[gap.nutrient]} eaten{gap.kind === "over" ? ". Lighter choices for the rest of the day:" : ". These would help:"}
            </p>
            <ProgressBar value={gap.eaten} max={gap.goal} tone={TONES[gap.nutrient]} size="sm" label={`${NAMES[gap.nutrient]} eaten against the goal`} />
          </header>
          {compact ? (
            <ul className={styles.chips}>
              {foods.map((idea) => <IdeaChip key={idea.food.id} idea={idea} gap={gap} onPick={onPick} />)}
            </ul>
          ) : (
            <ul className={cx(styles.list, styles.card)}>
              {foods.map((idea) => <IdeaRow key={idea.food.id} idea={idea} gap={gap} onPick={onPick} />)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
