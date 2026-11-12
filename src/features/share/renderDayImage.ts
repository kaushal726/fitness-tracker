/* Draws the day as a picture for sharing: the calories left or over, the four macros and each meal.
 * Simple on purpose, and always in the light colours so it reads the same wherever it is sent.
 * It is 1080 wide and from a square up to a phone story (9:16) tall, so every food fits; a very long day says how many more
 * there are. The pieces it draws with are in canvasKit.ts.
 */
import { calorieBalance, type DayReport } from "../../domain/dayReport.ts";
import { formatDate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { alpha, brandMark, C, type Ctx, FONT, FONT_WEIGHTS, fillRound, fit, line, mix, ring, setFont, text, widthOf, wrapList } from "./canvasKit.ts";

export interface Who {
  name: string;
  goalLabel: string;
}

export interface PictureOptions {
  /** False leaves out the names of the foods: calories, macros and the total of each meal only. */
  withFoods: boolean;
  /** The app's accent colour as a hex, for the ring and the highlights. */
  primary: string;
}

const W = 1080;
const PAD = 72;
const LEFT = PAD;
const RIGHT = W - PAD;
const MIN_HEIGHT = 1080;
/** A phone story, 9:16. */
const MAX_HEIGHT = 1920;
const MEAL_ROW_NO_FOODS = 64;
/** Where a meal's first line of foods sits under its name, and the room each line takes. */
const NAMES_TOP = 68;
const NAME_LINE = 34;
const NAMES_BOTTOM = 20;
const MAX_NAME_LINES = 5;
const NAME_FONT = { weight: 500, size: 25 } as const;
const FOOTER = 120;
const SECTION_GAP = 36;
const HEADER_END = PAD + 248;
const HERO_HEIGHT = 270;
const MACROS_HEIGHT = 104;
/** Where the first meal starts: under the header, the ring and the macros, each with its gap and a rule between. */
const MEALS_TOP = HEADER_END + SECTION_GAP + HERO_HEIGHT + SECTION_GAP + MACROS_HEIGHT + SECTION_GAP + 12;

const MACROS = [
  { key: "protein", label: "Protein", color: C.protein },
  { key: "carbs", label: "Carbs", color: C.carbs },
  { key: "fat", label: "Fat", color: C.fat },
  { key: "fiber", label: "Fiber", color: C.fiber },
] as const;

const share = (value: number, of: number): number => (of > 0 ? value / of : 0);

function header(ctx: Ctx, report: DayReport, who: Who, primary: string): number {
  brandMark(ctx, LEFT, PAD, 48, primary);
  text(ctx, "EatRight", LEFT + 64, PAD + 34, 800, 32, C.ink);
  text(ctx, formatDate(report.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }), RIGHT, PAD + 33, 600, 28, C.ink3, "right");
  const title = who.name ? `${who.name}'s day` : "My day";
  ctx.font = `800 64px ${FONT}`;
  text(ctx, fit(ctx, title, RIGHT - LEFT), LEFT, PAD + 150, 800, 64, C.ink);
  text(ctx, `${who.goalLabel}  ·  ${formatNumber(report.targets.calories)} kcal a day`, LEFT, PAD + 196, 600, 28, C.ink3);
  return HEADER_END;
}

function hero(ctx: Ctx, report: DayReport, y: number, primary: string): number {
  const height = HERO_HEIGHT;
  const { calories } = report.totals;
  const goal = report.targets.calories;
  const { over, amount } = calorieBalance(calories, goal);
  const accent = over ? C.over : primary;
  const radius = 112;
  const stroke = 26;
  const cx = LEFT + radius + stroke / 2 + 8;
  const cy = y + height / 2;
  ring(ctx, { cx, cy, radius, stroke, share: share(calories, goal), from: mix(accent, "#ffffff", 0.45), to: accent });
  text(ctx, formatNumber(amount), cx, cy + 14, 800, 68, over ? C.over : C.ink, "center");
  text(ctx, over ? "kcal over" : "kcal left", cx, cy + 54, 600, 26, C.ink3, "center");

  const x = cx + radius + stroke / 2 + 80;
  const stats: [string, number][] = [["Eaten", calories], ["Goal", goal]];
  stats.forEach(([label, value], i) => {
    const top = y + 78 + i * 104;
    text(ctx, label, x, top, 600, 26, C.ink3);
    const number = formatNumber(value);
    text(ctx, number, x, top + 52, 800, 52, C.ink);
    text(ctx, "kcal", x + widthOf(ctx, number, 800, 52) + 10, top + 52, 600, 26, C.ink3);
  });
  return y + height;
}

function macros(ctx: Ctx, report: DayReport, y: number): number {
  const gap = 28;
  const column = (RIGHT - LEFT - gap * (MACROS.length - 1)) / MACROS.length;
  MACROS.forEach(({ key, label, color }, i) => {
    const x = LEFT + i * (column + gap);
    const value = report.totals[key];
    const goal = report.targets[key];
    text(ctx, label, x, y + 26, 700, 26, C.ink3);
    const eaten = formatNumber(value);
    text(ctx, eaten, x, y + 72, 800, 40, C.ink);
    text(ctx, ` / ${formatNumber(goal)} g`, x + widthOf(ctx, eaten, 800, 40), y + 72, 600, 24, C.ink3);
    fillRound(ctx, x, y + 94, column, 10, 5, alpha(color, 0.18));
    fillRound(ctx, x, y + 94, Math.max(10, column * Math.min(1, share(value, goal))), 10, 5, color);
  });
  return y + MACROS_HEIGHT;
}

/** Each meal's foods as the lines they take; empty lines when the foods are left out. */
function foodLines(ctx: Ctx, report: DayReport, withFoods: boolean): string[][] {
  if (!withFoods) return report.meals.map(() => []);
  setFont(ctx, NAME_FONT.weight, NAME_FONT.size);
  return report.meals.map((meal) => wrapList(ctx, meal.items.map((item) => item.name), RIGHT - LEFT, MAX_NAME_LINES));
}

const rowHeight = (lines: string[]): number => (lines.length ? NAMES_TOP + (lines.length - 1) * NAME_LINE + NAMES_BOTTOM : MEAL_ROW_NO_FOODS);

function meals(ctx: Ctx, report: DayReport, y: number, lines: string[][]): number {
  let top = y;
  report.meals.forEach((meal, i) => {
    text(ctx, meal.label, LEFT, top + 32, 800, 32, C.ink);
    text(ctx, formatNumber(meal.calories), RIGHT - widthOf(ctx, " kcal", 600, 26), top + 32, 800, 32, C.ink, "right");
    text(ctx, " kcal", RIGHT, top + 32, 600, 26, C.ink3, "right");
    lines[i].forEach((l, n) => text(ctx, l, LEFT, top + NAMES_TOP + n * NAME_LINE, NAME_FONT.weight, NAME_FONT.size, C.ink3));
    top += rowHeight(lines[i]);
  });
  return top;
}

/** The height the picture needs for what is in it: a square at the least, a phone story at the most. */
function heightFor(lines: string[][]): number {
  const rows = lines.reduce((sum, l) => sum + rowHeight(l), 0);
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, MEALS_TOP + rows + FOOTER));
}

/** The day as a PNG, 1080 pixels wide. */
export async function renderDayImage(report: DayReport, who: Who, { withFoods, primary }: PictureOptions): Promise<Blob> {
  await Promise.all(FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 28px ${FONT}`))).catch(() => undefined);
  const out = document.createElement("canvas");
  out.width = W;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Pictures are not available here");
  // The foods are measured first: how many lines they take decides how tall the picture is.
  const lines = foodLines(ctx, report, withFoods);
  const height = heightFor(lines);
  out.height = height;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, height);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 900);
  glow.addColorStop(0, alpha(primary, 0.16));
  glow.addColorStop(1, alpha(primary, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, height);

  let y = header(ctx, report, who, primary) + SECTION_GAP;
  y = hero(ctx, report, y, primary) + SECTION_GAP;
  line(ctx, LEFT, RIGHT, y - SECTION_GAP / 2);
  y = macros(ctx, report, y) + SECTION_GAP;
  line(ctx, LEFT, RIGHT, y - SECTION_GAP / 2);
  meals(ctx, report, y + 12, lines);
  text(ctx, "Made with EatRight", W / 2, height - PAD + 8, 600, 24, C.ink3, "center");
  return new Promise((resolve, reject) => out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The picture could not be made"))), "image/png"));
}
