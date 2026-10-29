import type { IconType } from "react-icons";
import { MEAL_LABELS } from "../../domain/meals.ts";
import { formatDate } from "../../lib/dates.ts";
import type { MealType } from "../../nutrition/types.ts";
import { IconBreakfast, IconDinner, IconHistory, IconLunch, IconSnack, IconSparkles } from "../../ui/icons";
import type { Reason } from "./suggestions.ts";
import styles from "./ReasonChip.module.css";

const MEAL_ICONS: Record<MealType, IconType> = { breakfast: IconBreakfast, lunch: IconLunch, snack: IconSnack, dinner: IconDinner };

function describe(reason: Reason): { Icon: IconType; text: string } {
  switch (reason.kind) {
    case "earlier":
      return { Icon: MEAL_ICONS[reason.meal], text: `Had at ${MEAL_LABELS[reason.meal].toLowerCase()}` };
    case "yesterday":
      return { Icon: IconHistory, text: "Had yesterday" };
    case "with":
      return { Icon: IconSparkles, text: `Goes with ${reason.food.name}` };
    case "weekday":
      return { Icon: IconHistory, text: `Usual on ${formatDate(reason.date, { weekday: "long" })}s` };
  }
}

/** The reason in a few words, for a suggestion that is there for more than "you usually have it". */
export function ReasonChip({ reason }: { reason: Reason }) {
  const { Icon, text } = describe(reason);
  return (
    <span className={styles.chip}>
      <Icon className={styles.icon} aria-hidden />
      <span className={styles.text}>{text}</span>
    </span>
  );
}
