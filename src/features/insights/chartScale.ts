const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** A round number at or above `value`: one of 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 or 10 of a power of ten. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const unit = value / power;
  return (NICE_STEPS.find((s) => unit <= s + 1e-9) ?? 10) * power;
}

/** Maps a value in [from, to] onto [start, end]. */
export function linear(from: number, to: number, start: number, end: number): (value: number) => number {
  const span = to - from || 1;
  return (value) => start + ((value - from) / span) * (end - start);
}

/** "+1,200" or "−300" with a real minus sign: the sign is the point of a balance. */
export function signed(value: number): string {
  const rounded = Math.round(value);
  const text = Math.abs(rounded).toLocaleString("en-IN");
  return rounded > 0 ? `+${text}` : rounded < 0 ? `−${text}` : "0";
}

/** The index of the item a pointer is over, for `count` equal slots across `width` pixels. */
export function slotAt(offsetX: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor((offsetX / width) * count)));
}
