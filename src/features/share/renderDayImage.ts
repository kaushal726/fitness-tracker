/* Draws the day as a picture for sharing, always in the light colours so it reads the same wherever it is sent.
 * Plain canvas drawing: no library, and the fonts are the app's own.
 */
import type { DayReport } from "../../domain/dayReport.ts";
import { formatDate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";

export interface Who {
  name: string;
  goalLabel: string;
}

export interface PictureOptions {
  /** False leaves out the names of the foods: calories, macros and the total of each meal only. */
  withFoods: boolean;
  /** The app's accent colour as a hex, for the ring and the name. */
  primary: string;
}

const W = 1080;
const PAD = 56;
const INNER = W - PAD * 2;
const CARD_PAD = 40;
const GAP = 28;
const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const ITEM_ROW = 48;
const OVER_SHARE = 1.05;
/** The most the picture can need besides one row for every food: the top, the cards and the footer. */
const BASE_HEIGHT = 1400;
const MEAL_EXTRA = 90;

const C = { bg: "#f6f5f0", card: "#ffffff", line: "#e7e5dd", ink: "#15201a", ink2: "#4a5a50", ink3: "#78877d", over: "#e2692f", track: "#ebe9e1", protein: "#4a6fe3", carbs: "#dc9518", fat: "#d8597a", fiber: "#2f9e6b" };
const MACROS = [
  { key: "protein", label: "Protein", color: C.protein },
  { key: "carbs", label: "Carbs", color: C.carbs },
  { key: "fat", label: "Fat", color: C.fat },
  { key: "fiber", label: "Fiber", color: C.fiber },
] as const;

type Ctx = CanvasRenderingContext2D;

const setFont = (ctx: Ctx, weight: number, size: number): void => {
  ctx.font = `${weight} ${size}px ${FONT}`;
};

function text(ctx: Ctx, value: string, x: number, y: number, weight: number, size: number, color: string, align: CanvasTextAlign = "left"): void {
  setFont(ctx, weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function card(ctx: Ctx, y: number, height: number): void {
  roundRect(ctx, PAD, y, INNER, height, 40);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** The text cut with an ellipsis so it fits in `max` pixels. */
function fit(ctx: Ctx, value: string, max: number): string {
  if (ctx.measureText(value).width <= max) return value;
  let cut = value;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function bar(ctx: Ctx, x: number, y: number, w: number, share: number, color: string): void {
  roundRect(ctx, x, y, w, 16, 8);
  ctx.fillStyle = C.track;
  ctx.fill();
  if (share > 0) {
    roundRect(ctx, x, y, Math.max(16, w * Math.min(1, share)), 16, 8);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function hero(ctx: Ctx, report: DayReport, y: number, withFoods: boolean, primary: string): number {
  const height = 340;
  card(ctx, y, height);
  const { calories } = report.totals;
  const goal = report.targets.calories;
  const cx = PAD + CARD_PAD + 150;
  const cy = y + height / 2;
  const over = calories > goal * OVER_SHARE;
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.strokeStyle = C.track;
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.stroke();
  if (calories > 0) {
    ctx.strokeStyle = over ? C.over : primary;
    ctx.beginPath();
    ctx.arc(cx, cy, 118, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, calories / goal));
    ctx.stroke();
  }
  text(ctx, formatNumber(calories), cx, cy + 10, 800, 64, C.ink, "center");
  text(ctx, "kcal eaten", cx, cy + 52, 600, 26, C.ink3, "center");

  const x = cx + 118 + 80;
  const left = goal - calories;
  const rows: [string, string, string][] = [
    ["Goal", `${formatNumber(goal)} kcal`, C.ink],
    [left >= 0 ? "Left" : "Over", `${formatNumber(Math.abs(left))} kcal`, left >= 0 ? primary : C.over],
    withFoods ? ["Foods logged", String(report.itemCount), C.ink] : ["Meals logged", String(report.meals.length), C.ink],
  ];
  rows.forEach(([label, value, color], i) => {
    const top = y + 72 + i * 82;
    text(ctx, label, x, top, 600, 26, C.ink3);
    text(ctx, value, x, top + 40, 800, 40, color);
  });
  return y + height + GAP;
}

function macros(ctx: Ctx, report: DayReport, y: number): number {
  const rowHeight = 92;
  const height = CARD_PAD * 2 + rowHeight * MACROS.length - 20;
  card(ctx, y, height);
  MACROS.forEach(({ key, label, color }, i) => {
    const top = y + CARD_PAD + i * rowHeight;
    const value = report.totals[key];
    const goal = report.targets[key];
    text(ctx, label, PAD + CARD_PAD, top + 28, 700, 30, C.ink2);
    text(ctx, `${formatNumber(value)} / ${formatNumber(goal)} g`, W - PAD - CARD_PAD, top + 28, 800, 30, C.ink, "right");
    bar(ctx, PAD + CARD_PAD, top + 44, INNER - CARD_PAD * 2, goal > 0 ? value / goal : 0, color);
  });
  return y + height + GAP;
}

/** How many lines of food a meal shows under its name: every food, or none when the foods are left out. */
const shownItems = (meal: DayReport["meals"][number], withFoods: boolean): number => (withFoods ? meal.items.length : 0);

function meals(ctx: Ctx, report: DayReport, y: number, withFoods: boolean): number {
  const blocks = report.meals.reduce((sum, m) => sum + 56 + shownItems(m, withFoods) * ITEM_ROW + 28, 0);
  const height = report.meals.length === 0 ? CARD_PAD * 2 + 40 : CARD_PAD * 2 - 14 + blocks;
  card(ctx, y, height);
  const left = PAD + CARD_PAD;
  const right = W - PAD - CARD_PAD;
  let top = y + CARD_PAD + 14;
  if (report.meals.length === 0) text(ctx, "Nothing logged yet", left, top + 20, 600, 28, C.ink3);
  for (const meal of report.meals) {
    text(ctx, meal.label, left, top + 22, 800, 32, C.ink);
    text(ctx, `${formatNumber(meal.calories)} kcal`, right, top + 22, 800, 30, C.ink, "right");
    top += 56;
    if (withFoods) {
      for (const item of meal.items) {
        const amount = `${formatNumber(item.calories)} kcal`;
        setFont(ctx, 500, 26);
        const room = right - left - ctx.measureText(amount).width - 28;
        text(ctx, fit(ctx, `${item.name}  \u00b7  ${item.portion}`, room), left, top + 14, 500, 26, C.ink2);
        text(ctx, amount, right, top + 14, 500, 26, C.ink3, "right");
        top += ITEM_ROW;
      }
    }
    top += 28;
  }
  return y + height + GAP;
}

/** The day as a PNG, 1080 pixels wide and as tall as its content. */
export async function renderDayImage(report: DayReport, who: Who, { withFoods, primary }: PictureOptions): Promise<Blob> {
  await Promise.all([document.fonts.load(`800 40px ${FONT}`), document.fonts.load(`600 28px ${FONT}`)]).catch(() => undefined);
  const work = document.createElement("canvas");
  work.width = W;
  work.height = BASE_HEIGHT + report.itemCount * ITEM_ROW + report.meals.length * MEAL_EXTRA;
  const ctx = work.getContext("2d");
  if (!ctx) throw new Error("Pictures are not available here");

  text(ctx, "EatRight", PAD, PAD + 34, 800, 36, primary);
  text(ctx, formatDate(report.date, { weekday: "long", day: "numeric", month: "short", year: "numeric" }), W - PAD, PAD + 34, 600, 28, C.ink3, "right");
  text(ctx, fit(ctx, who.name ? `${who.name}'s day` : "My day", INNER), PAD, PAD + 120, 800, 64, C.ink);
  text(ctx, `${who.goalLabel}  ·  ${formatNumber(report.targets.calories)} kcal a day`, PAD, PAD + 168, 600, 28, C.ink3);

  let y = PAD + 212;
  y = hero(ctx, report, y, withFoods, primary);
  y = macros(ctx, report, y);
  y = meals(ctx, report, y, withFoods);
  text(ctx, "Made with EatRight", W / 2, y + 24, 600, 24, C.ink3, "center");

  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.min(work.height, y + 24 + PAD);
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Pictures are not available here");
  outCtx.fillStyle = C.bg;
  outCtx.fillRect(0, 0, out.width, out.height);
  outCtx.drawImage(work, 0, 0);
  return new Promise((resolve, reject) => out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The picture could not be made"))), "image/png"));
}
