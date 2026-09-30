import { useEffect, useRef } from "react";
import { isTopSheet, registerSheet, unregisterSheet } from "./sheetHistory.ts";

/**
 * While `active`, the phone's Back button and Escape call `onBack` instead of closing the sheet underneath.
 * For a view inside a sheet (a category, a form) or a small popover: Back steps out of it first.
 */
export function useBackLayer(active: boolean, onBack: () => void): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const id = registerSheet(() => onBackRef.current());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTopSheet(id)) onBackRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unregisterSheet(id);
    };
  }, [active]);
}
