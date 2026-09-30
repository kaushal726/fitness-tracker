import { useEffect, type RefObject } from "react";
import { scrollParent } from "./scroll.ts";

/** Takes the sheet body holding `ref` to the top when a view appears, and again when it goes, so the view underneath starts at its top. */
export function useScrollTop(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const parent = scrollParent(ref.current);
    const toTop = () => parent?.scrollTo({ top: 0 });
    toTop();
    return toTop;
  }, [ref]);
}
