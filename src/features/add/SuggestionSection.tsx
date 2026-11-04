import { useState } from "react";
import type { IconType } from "react-icons";
import type { LastUsed } from "../../data/types.ts";
import { cx } from "../../lib/cx.ts";
import type { Food } from "../../nutrition/types.ts";
import { IconChevronDown, IconFlame, IconHeart, IconLeaf, IconMuscle, IconSparkles, IconStar, IconZap } from "../../ui/icons";
import { SuggestionRows } from "./SuggestionRows.tsx";
import type { SectionKind, SuggestionSection as Section } from "./suggestions.ts";
import styles from "./SuggestionSection.module.css";

/** How many rows a section shows before "Show more": the page is long, and the first few are the ones that matter. */
const FIRST_ROWS = 5;

const KINDS: Record<SectionKind, { Icon: IconType; tone: string; hint: string }> = {
  likely: { Icon: IconZap, tone: styles.green, hint: "What you usually have, and what fits the day" },
  sabzi: { Icon: IconLeaf, tone: styles.fiber, hint: "The sabzis you eat most" },
  more: { Icon: IconHeart, tone: styles.fat, hint: "Your favourites and what you eat and drink most" },
  protein: { Icon: IconMuscle, tone: styles.protein, hint: "To close today's protein gap" },
  popular: { Icon: IconFlame, tone: styles.carbs, hint: "What most people eat" },
  moreSabzi: { Icon: IconLeaf, tone: styles.fiber, hint: "Like the ones you eat" },
  healthy: { Icon: IconStar, tone: styles.green, hint: "Light, high in protein or fibre" },
  different: { Icon: IconSparkles, tone: styles.protein, hint: "A change, different every day" },
};

interface Props {
  section: Section;
  addedFoodIds: Set<string>;
  onSelect: (food: Food, portion?: LastUsed) => void;
  onQuickAdd: (food: Food, portion: LastUsed) => void;
}

/** One list of suggested foods under a heading that says what it is and why; the rest of a long one is a tap away. */
export function SuggestionSection({ section, addedFoodIds, onSelect, onQuickAdd }: Props) {
  const [open, setOpen] = useState(false);
  const { Icon, tone, hint } = KINDS[section.kind];
  const hidden = Math.max(0, section.items.length - FIRST_ROWS);
  const items = open ? section.items : section.items.slice(0, FIRST_ROWS);
  return (
    <section className={styles.section} aria-label={section.title}>
      <header className={styles.head}>
        <span className={cx(styles.chip, tone)} aria-hidden><Icon /></span>
        <div className={styles.text}>
          <h2 className={styles.title}>{section.title}</h2>
          <p className={styles.hint}>{hint}</p>
        </div>
        <span className={cx(styles.count, "num")}>{section.items.length}</span>
      </header>
      <SuggestionRows items={items} addedFoodIds={addedFoodIds} onSelect={onSelect} onQuickAdd={onQuickAdd} />
      {hidden > 0 && (
        <button type="button" className={styles.more} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Show less" : `Show ${hidden} more`}
          <IconChevronDown className={cx(styles.chevron, open && styles.up)} aria-hidden />
        </button>
      )}
    </section>
  );
}
