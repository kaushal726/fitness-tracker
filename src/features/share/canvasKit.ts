/* The small drawing pieces the shared picture is built from: text, rounded shapes, rings, pills and colour mixing.
 * Plain canvas, no library. Colours are always the light ones so the picture reads the same wherever it is sent.
 */
export type Ctx = CanvasRenderingContext2D;

export const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

/** The weights the picture uses; each has to be loaded before drawing or the canvas falls back to another font. */
export const FONT_WEIGHTS = [500, 600, 700, 800] as const;

export const C = {
  bg: "#f6f5f0",
  card: "#ffffff",
  line: "#ebe9e1",
  ink: "#15201a",
  ink2: "#4a5a50",
  ink3: "#78877d",
  over: "#e2692f",
  track: "#ebe9e1",
  protein: "#4a6fe3",
  carbs: "#dc9518",
  fat: "#d8597a",
  fiber: "#2f9e6b",
} as const;

const HEX_RADIX = 16;
const FULL_RING_SHARE = 0.98;
const RING_START = -Math.PI / 2;
const FULL_TURN = Math.PI * 2;

function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, HEX_RADIX);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `hex` with `a` (0 to 1) of opacity, as a CSS colour. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** The colour `t` of the way (0 to 1) from `from` to `to`, as a hex. */
export function mix(from: string, to: string, t: number): string {
  const [a, b] = [rgbOf(from), rgbOf(to)];
  const channel = (i: number): string => Math.round(a[i] + (b[i] - a[i]) * t).toString(HEX_RADIX).padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function setFont(ctx: Ctx, weight: number, size: number): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

export function text(ctx: Ctx, value: string, x: number, y: number, weight: number, size: number, color: string, align: CanvasTextAlign = "left"): void {
  setFont(ctx, weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
}

/** How wide the text is at that weight and size. */
export function widthOf(ctx: Ctx, value: string, weight: number, size: number): number {
  setFont(ctx, weight, size);
  return ctx.measureText(value).width;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** The text cut with an ellipsis so it fits in `max` pixels, at the font last set. */
export function fit(ctx: Ctx, value: string, max: number): string {
  if (ctx.measureText(value).width <= max) return value;
  let cut = value;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export function line(ctx: Ctx, x1: number, x2: number, y: number, color: string = C.line): void {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1, 2);
}

/** A white card with a soft shadow, so it lifts off the page without a heavy edge. */
export function card(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.shadowColor = "rgba(21, 32, 26, 0.07)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 10;
  fillRound(ctx, x, y, w, h, 44, C.card);
  ctx.restore();
  roundRect(ctx, x, y, w, h, 44);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export interface RingOptions {
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  /** How far round it goes, 0 to 1; more than 1 is a full ring. */
  share: number;
  from: string;
  to: string;
  /** A soft glow of the end colour around the arc. */
  glow?: boolean;
}

/** A ring: a faint track and an arc from the top that goes lighter to darker, with round ends. */
export function ring(ctx: Ctx, { cx, cy, radius, stroke, share, from, to, glow = false }: RingOptions): void {
  ctx.save();
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.strokeStyle = alpha(to, 0.16);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, FULL_TURN);
  ctx.stroke();
  const done = Math.min(1, Math.max(0, share));
  if (done > 0) {
    if (glow) {
      ctx.shadowColor = alpha(to, 0.4);
      ctx.shadowBlur = 30;
    }
    if (done < FULL_RING_SHARE && typeof ctx.createConicGradient === "function") {
      // The round ends reach past the arc by half the stroke, so the gradient starts and ends that much further out.
      const cap = stroke / 2 / radius / FULL_TURN;
      const gradient = ctx.createConicGradient(RING_START - cap * FULL_TURN, cx, cy);
      gradient.addColorStop(0, from);
      gradient.addColorStop(Math.min(1, Math.max(0.01, done + cap * 2)), to);
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = to;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, RING_START, RING_START + FULL_TURN * done);
    ctx.stroke();
  }
  ctx.restore();
}

export interface PillOptions {
  size: number;
  weight: number;
  color: string;
  background: string;
  border?: string;
  padX?: number;
  height?: number;
}

/** A rounded label with its left edge (or right edge, when `alignRight`) at `x`; returns how wide it is. */
export function pill(ctx: Ctx, label: string, x: number, y: number, { size, weight, color, background, border, padX = 26, height = 56 }: PillOptions, alignRight = false): number {
  const width = widthOf(ctx, label, weight, size) + padX * 2;
  const left = alignRight ? x - width : x;
  fillRound(ctx, left, y, width, height, height / 2, background, border);
  text(ctx, label, left + padX, y + height / 2 + size * 0.35, weight, size, color);
  return width;
}

/** A tick, centred on a point. */
export function tick(ctx: Ctx, cx: number, cy: number, size: number, color: string, weight: number): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy + size * 0.02);
  ctx.lineTo(cx - size * 0.12, cy + size * 0.4);
  ctx.lineTo(cx + size * 0.55, cy - size * 0.38);
  ctx.stroke();
  ctx.restore();
}

export function dot(ctx: Ctx, cx: number, cy: number, radius: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, FULL_TURN);
  ctx.fill();
}

/** The app's mark: a rounded square in the accent with a leaf. */
export function brandMark(ctx: Ctx, x: number, y: number, size: number, primary: string): void {
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, mix(primary, "#ffffff", 0.3));
  gradient.addColorStop(1, primary);
  fillRound(ctx, x, y, size, size, size * 0.3, gradient);
  const u = size / 60;
  const cx = x + size / 2;
  const cy = y + size / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - 2 * u, cy + 16 * u);
  ctx.bezierCurveTo(cx - 20 * u, cy + 6 * u, cx - 16 * u, cy - 14 * u, cx + 14 * u, cy - 17 * u);
  ctx.bezierCurveTo(cx + 18 * u, cy + 8 * u, cx + 2 * u, cy + 18 * u, cx - 2 * u, cy + 16 * u);
  ctx.closePath();
  ctx.fill();
}
