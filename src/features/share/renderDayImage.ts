/* Draws the day as a picture for sharing: the calories against the goal, the macros, where the calories came from and each meal.
 * Always in the light colours, so it reads the same wherever it is sent. The pieces it draws with are in canvasKit.ts.
 */
import { calorieStatus, type CalorieStatus, type DayReport } from "../../domain/dayReport.ts";
import { formatDate, formatTime } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { alpha, brandMark, C, card, type Ctx, dot, FONT, FONT_WEIGHTS, fillRound, fit, line, mix, pill, ring, text, tick, widthOf } from "./canvasKit.ts";

export interface Who {
  name: string;
  goalLabel: string;
}

export interface PictureOptions {
  /** False leaves out the names of the foods: calories, macros and the total of each meal only. */
  withFoods: boolean;
  /** The app's accent colour as a hex, for the ring, the name and the highlights. */
  primary: string;
}

const W = 1080;
const PAD = 56;
const INNER = W - PAD * 2;
const CARD_PAD = 44;
const GAP = 28;
const LEFT = PAD + CARD_PAD;
const RIGHT = W - PAD - CARD_PAD;
const ITEM_ROW = 60;
/** From the top of a meal to its first food: the name, the time, the bar and the macros; a little less when no foods follow. */
const MEAL_HEAD = 188;
const MEAL_HEAD_NO_FOODS = 170;
const MEAL_GAP = 36;
/** The most the picture can need besides one row for every food and a block for every meal; the picture is cut to what was drawn. */
const BASE_HEIGHT = 1700;
const ITEM_ALLOWANCE = 64;
const MEAL_ALLOWANCE = 200;
const PERCENT = 100;

const MACROS = [
  { key: "protein", label: "Protein", color: C.protein },
  { key: "carbs", label: "Carbs", color: C.carbs },
  { key: "fat", label: "Fat", color: C.fat },
  { key: "fiber", label: "Fiber", color: C.fiber },
] as const;

const SPLIT = [
  { key: "protein", label: "Protein", color: C.protein },
  { key: "carbs", label: "Carbs", color: C.carbs },
  { key: "fat", label: "Fat", color: C.fat },
] as const;

const STATUS_NOTE: Record<CalorieStatus, string> = { under: "On the way", close: "Almost there", on: "Right on target", over: "Over today's goal" };

const share = (value: number, of: number): number => (of > 0 ? value / of : 0);
const wholePercent = (value: number, of: number): number => Math.round(share(value, of) * PERCENT);

function header(ctx: Ctx, report: DayReport, who: Who, primary: string): number {
  brandMark(ctx, PAD, PAD, 60, primary);
  text(ctx, "EatRight", PAD + 78, PAD + 42, 800, 36, C.ink);
  pill(ctx, formatDate(report.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }), W - PAD, PAD + 2, { size: 26, weight: 600, color: C.ink2, background: C.card, border: C.line }, true);
  const title = who.name ? `${who.name}'s day` : "My day";
  const titleY = PAD + 168;
  ctx.font = `800 76px ${FONT}`;
  text(ctx, fit(ctx, title, INNER), PAD, titleY, 800, 76, C.ink);
  pill(ctx, `${who.goalLabel}  ·  ${formatNumber(report.targets.calories)} kcal a day`, PAD, titleY + 30, { size: 26, weight: 700, color: mix(primary, C.ink, 0.35), background: alpha(primary, 0.12), padX: 24, height: 52 });
  return titleY + 30 + 52 + 48;
}

function hero(ctx: Ctx, report: DayReport, y: number, withFoods: boolean, primary: string): number {
  const height = 420;
  card(ctx, PAD, y, INNER, height);
  const { calories } = report.totals;
  const goal = report.targets.calories;
  const status = calorieStatus(calories, goal);
  const over = status === "over";
  const accent = over ? C.over : primary;
  const left = goal - calories;

  const radius = 134;
  const cx = LEFT + 20 + radius + 18;
  const cy = y + height / 2;
  ring(ctx, { cx, cy, radius, stroke: 36, share: share(calories, goal), from: mix(accent, "#ffffff", 0.5), to: accent, glow: true });
  text(ctx, formatNumber(Math.abs(left)), cx, cy + 22, 800, 84, over ? C.over : C.ink, "center");
  text(ctx, over ? "kcal over" : "kcal left", cx, cy + 66, 700, 28, C.ink3, "center");

  const x = cx + radius + 18 + 64;
  const note = status === "under" ? `${wholePercent(calories, goal)}% of your goal` : STATUS_NOTE[status];
  pill(ctx, note, x, y + 56, { size: 26, weight: 700, color: over ? C.over : mix(primary, C.ink, 0.35), background: alpha(accent, 0.13), padX: 24, height: 52 });

  const stats: [string, number][] = [["Eaten", calories], ["Goal", goal]];
  stats.forEach(([label, value], i) => {
    const sx = x + i * 250;
    text(ctx, label, sx, y + 182, 600, 26, C.ink3);
    text(ctx, formatNumber(value), sx, y + 242, 800, 58, C.ink);
    text(ctx, "kcal", sx + widthOf(ctx, formatNumber(value), 800, 58) + 10, y + 242, 600, 26, C.ink3);
  });
  line(ctx, x, W - PAD - CARD_PAD, y + 284);
  const logged = withFoods
    ? `${report.itemCount} ${report.itemCount === 1 ? "food" : "foods"} across ${report.meals.length} ${report.meals.length === 1 ? "meal" : "meals"}`
    : `${report.meals.length} ${report.meals.length === 1 ? "meal" : "meals"} logged`;
  text(ctx, logged, x, y + 338, 600, 28, C.ink2);
  return y + height + GAP;
}

function macros(ctx: Ctx, report: DayReport, y: number): number {
  const height = 550;
  card(ctx, PAD, y, INNER, height);
  text(ctx, "MACROS", LEFT, y + CARD_PAD + 22, 800, 24, C.ink3);
  const column = (INNER - CARD_PAD * 2) / MACROS.length;
  const cy = y + 170;
  MACROS.forEach(({ key, label, color }, i) => {
    const cx = LEFT + column * (i + 0.5);
    const value = report.totals[key];
    const goal = report.targets[key];
    const done = share(value, goal);
    ring(ctx, { cx, cy, radius: 62, stroke: 16, share: done, from: color, to: color });
    if (done >= 1) tick(ctx, cx, cy, 30, color, 7);
    else text(ctx, `${Math.min(99, Math.floor(done * PERCENT))}%`, cx, cy + 11, 800, 30, C.ink2, "center");
    text(ctx, label, cx, cy + 118, 800, 28, color, "center");
    const eaten = formatNumber(value);
    const rest = ` / ${formatNumber(goal)} g`;
    const total = widthOf(ctx, eaten, 800, 32) + widthOf(ctx, rest, 600, 24);
    const startX = cx - total / 2;
    text(ctx, eaten, startX, cy + 162, 800, 32, C.ink);
    text(ctx, rest, startX + widthOf(ctx, eaten, 800, 32), cy + 162, 600, 24, C.ink3);
  });

  line(ctx, LEFT, RIGHT, y + 366);
  const split = report.energySplit;
  if (split.protein + split.carbs + split.fat === 0) return y + height + GAP;
  text(ctx, "Where your calories came from", LEFT, y + 418, 700, 28, C.ink2);
  const barY = y + 442;
  const barW = RIGHT - LEFT;
  const gap = 6;
  let bx = LEFT;
  const parts = SPLIT.filter(({ key }) => split[key] > 0);
  parts.forEach(({ key, color }) => {
    const w = (barW - gap * (parts.length - 1)) * (split[key] / PERCENT);
    fillRound(ctx, bx, barY, w, 30, 15, color);
    bx += w + gap;
  });
  const legend = barW / SPLIT.length;
  SPLIT.forEach(({ key, label, color }, i) => {
    const lx = LEFT + legend * i;
    dot(ctx, lx + 8, y + 510, 8, color);
    text(ctx, `${label} ${split[key]}%`, lx + 26, y + 519, 700, 26, C.ink2);
  });
  return y + height + GAP;
}

function mealHeight(meal: DayReport["meals"][number], withFoods: boolean): number {
  return (withFoods ? MEAL_HEAD + meal.items.length * ITEM_ROW : MEAL_HEAD_NO_FOODS) + MEAL_GAP;
}

function meals(ctx: Ctx, report: DayReport, y: number, withFoods: boolean, primary: string): number {
  const blocks = report.meals.reduce((sum, m) => sum + mealHeight(m, withFoods), 0);
  const height = CARD_PAD + 56 + blocks - MEAL_GAP + CARD_PAD;
  card(ctx, PAD, y, INNER, height);
  text(ctx, "MEALS", LEFT, y + CARD_PAD + 22, 800, 24, C.ink3);
  let top = y + CARD_PAD + 56;
  report.meals.forEach((meal, index) => {
    text(ctx, meal.label, LEFT, top + 36, 800, 38, C.ink);
    text(ctx, formatNumber(meal.calories), RIGHT - widthOf(ctx, " kcal", 600, 26), top + 36, 800, 38, C.ink, "right");
    text(ctx, " kcal", RIGHT, top + 36, 600, 26, C.ink3, "right");
    text(ctx, formatTime(meal.at), LEFT, top + 74, 600, 25, C.ink3);
    text(ctx, `${wholePercent(meal.calories, report.totals.calories)}% of the day`, RIGHT, top + 74, 600, 25, C.ink3, "right");
    fillRound(ctx, LEFT, top + 94, RIGHT - LEFT, 12, 6, alpha(primary, 0.14));
    fillRound(ctx, LEFT, top + 94, Math.max(12, (RIGHT - LEFT) * share(meal.calories, report.totals.calories)), 12, 6, primary);

    let mx = LEFT;
    for (const { key, label, color } of SPLIT) {
      const grams = `${label} ${formatNumber(meal[key])} g`;
      dot(ctx, mx + 7, top + 138, 7, color);
      text(ctx, grams, mx + 22, top + 146, 600, 25, C.ink2);
      mx += 22 + widthOf(ctx, grams, 600, 25) + 36;
    }

    let rowY = top + MEAL_HEAD;
    if (withFoods) {
      meal.items.forEach((item, i) => {
        const amount = `${formatNumber(item.calories)} kcal`;
        const room = RIGHT - LEFT - widthOf(ctx, amount, 600, 27) - 32;
        const portion = item.portion;
        const portionW = widthOf(ctx, portion, 500, 25);
        ctx.font = `600 28px ${FONT}`;
        const name = fit(ctx, item.name, Math.max(120, room - portionW - 18));
        text(ctx, name, LEFT, rowY + 8, 600, 28, C.ink);
        text(ctx, portion, LEFT + widthOf(ctx, name, 600, 28) + 16, rowY + 8, 500, 25, C.ink3);
        text(ctx, amount, RIGHT, rowY + 8, 600, 27, C.ink2, "right");
        if (i < meal.items.length - 1) line(ctx, LEFT, RIGHT, rowY + 34);
        rowY += ITEM_ROW;
      });
    }
    top += mealHeight(meal, withFoods);
    if (index < report.meals.length - 1) line(ctx, LEFT, RIGHT, top - MEAL_GAP / 2 - 4);
  });
  return y + height + GAP;
}

function footer(ctx: Ctx, y: number, primary: string): number {
  brandMark(ctx, W / 2 - 150, y, 34, primary);
  text(ctx, "Made with EatRight", W / 2 - 100, y + 26, 700, 28, C.ink2);
  return y + 34;
}

/** The day as a PNG, 1080 pixels wide and as tall as its content. */
export async function renderDayImage(report: DayReport, who: Who, { withFoods, primary }: PictureOptions): Promise<Blob> {
  await Promise.all(FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 28px ${FONT}`))).catch(() => undefined);
  const work = document.createElement("canvas");
  work.width = W;
  work.height = BASE_HEIGHT + report.itemCount * ITEM_ALLOWANCE + report.meals.length * MEAL_ALLOWANCE;
  const ctx = work.getContext("2d");
  if (!ctx) throw new Error("Pictures are not available here");

  let y = header(ctx, report, who, primary);
  y = hero(ctx, report, y, withFoods, primary);
  y = macros(ctx, report, y);
  y = meals(ctx, report, y, withFoods, primary);
  const end = footer(ctx, y + 8, primary) + PAD;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.min(work.height, end);
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Pictures are not available here");
  outCtx.fillStyle = C.bg;
  outCtx.fillRect(0, 0, out.width, out.height);
  const glow = outCtx.createRadialGradient(0, 0, 0, 0, 0, 980);
  glow.addColorStop(0, alpha(primary, 0.2));
  glow.addColorStop(1, alpha(primary, 0));
  outCtx.fillStyle = glow;
  outCtx.fillRect(0, 0, out.width, out.height);
  outCtx.drawImage(work, 0, 0);
  return new Promise((resolve, reject) => out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The picture could not be made"))), "image/png"));
}
