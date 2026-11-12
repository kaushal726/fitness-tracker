import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useBackLayer } from "../app/useBackLayer";
import { cx } from "../lib/cx";
import { IconCheck } from "./icons";
import styles from "./Menu.module.css";

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  /** A small picture before the label. */
  icon?: ReactNode;
  /** A quiet second line. */
  hint?: string;
}

interface MenuProps<T extends string> {
  /** What the menu opens from: it sits under it, or over it when there is no room below. */
  anchor: RefObject<HTMLElement | null>;
  options: MenuOption<T>[];
  value: T;
  /** What is being chosen, for a screen reader. */
  label: string;
  onPick: (value: T) => void;
  onClose: () => void;
  /** As wide as what it opens from (a field), instead of as wide as its options (a small button). */
  matchWidth?: boolean;
}

const GAP = 6;
const EDGE = 12;
const MIN_WIDTH = 200;
const MAX_HEIGHT = 320;

interface Place {
  top: number;
  left: number;
  width?: number;
  maxHeight: number;
  above: boolean;
}

function placeUnder(anchor: HTMLElement, matchWidth: boolean): Place {
  const r = anchor.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - GAP - EDGE;
  const aboveRoom = r.top - GAP - EDGE;
  const above = below < Math.min(MAX_HEIGHT, 220) && aboveRoom > below;
  const maxHeight = Math.min(MAX_HEIGHT, above ? aboveRoom : below);
  const width = matchWidth ? Math.max(r.width, MIN_WIDTH) : undefined;
  const left = Math.max(EDGE, Math.min(r.left, window.innerWidth - (width ?? MIN_WIDTH) - EDGE));
  return { top: above ? r.top - GAP : r.bottom + GAP, left, width, maxHeight, above };
}

/**
 * A small floating list to pick one thing from, the app's own look in place of the phone's picker. It opens on the
 * chosen option, moves with the arrow keys, and closes on a pick, a tap outside, Escape, Back, or a scroll of the page.
 */
export function Menu<T extends string>({ anchor, options, value, label, onPick, onClose, matchWidth = false }: MenuProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const id = useId();
  useBackLayer(true, onClose);

  // Follow what it opened from while open, in case that is still sliding into place (a page that is arriving).
  useLayoutEffect(() => {
    let frame = 0;
    const follow = () => {
      if (anchor.current) {
        const next = placeUnder(anchor.current, matchWidth);
        setPlace((prev) => (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.maxHeight === next.maxHeight ? prev : next));
      }
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [anchor, matchWidth]);

  // Focus the chosen option once the menu is in place, so the keys start from it.
  const placed = place !== null;
  useEffect(() => {
    if (!placed) return;
    const chosen = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? listRef.current?.querySelector<HTMLElement>("[role=option]");
    chosen?.focus({ preventScroll: true });
    chosen?.scrollIntoView({ block: "nearest" });
  }, [placed]);

  useEffect(() => {
    const inside = (target: EventTarget | null) => target instanceof Node && (listRef.current?.contains(target) || anchor.current?.contains(target));
    const onPointerDown = (e: PointerEvent) => {
      if (!inside(e.target)) onClose();
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Tab") onClose();
  };

  const pick = (v: T) => {
    onPick(v);
    onClose();
    anchor.current?.focus({ preventScroll: true });
  };

  if (!place) return null;
  const style: CSSProperties = { top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight };
  return createPortal(
    <div ref={listRef} id={id} className={cx(styles.menu, place.above && styles.above)} style={style} role="listbox" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((o) => {
        const chosen = o.value === value;
        return (
          <button key={o.value} type="button" role="option" aria-selected={chosen} className={styles.option} onClick={() => pick(o.value)}>
            {o.icon && <span className={styles.icon} aria-hidden>{o.icon}</span>}
            <span className={styles.text}>
              <span className={styles.label}>{o.label}</span>
              {o.hint && <span className={styles.hint}>{o.hint}</span>}
            </span>
            <IconCheck className={styles.check} aria-hidden />
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
