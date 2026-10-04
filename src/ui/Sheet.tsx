/* Responsive dialog: a bottom sheet (or full screen for longer flows) on phones, a centred modal on
 * larger screens. Closes on Back, Escape, the close button or a backdrop tap.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isTopSheet, openSheetCount, registerSheet, unregisterSheet } from "../app/sheetHistory";
import { cx } from "../lib/cx";
import { IconButton } from "./Button";
import { IconBack, IconClose } from "./icons";
import styles from "./Sheet.module.css";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerAction?: ReactNode;
  /** Stays under the header while the body scrolls, such as a search field. */
  toolbar?: ReactNode;
  /** Puts a back arrow before the title, for a view that was reached from another one. */
  onBack?: () => void;
  /** "full" = tall on phones, for flows with their own scrolling content. "page" = the whole screen on phones, for a flow that has it to itself. */
  size?: "auto" | "full" | "page";
}

let openCount = 0;

function useScrollLock(): void {
  useEffect(() => {
    openCount += 1;
    document.body.classList.add("sheet-open");
    return () => {
      openCount -= 1;
      if (!openCount) document.body.classList.remove("sheet-open");
    };
  }, []);
}

export function Sheet(props: SheetProps) {
  return props.open ? <SheetPanel {...props} /> : null;
}

function SheetPanel({ onClose, title, subtitle, children, footer, headerAction, toolbar, onBack, size = "auto" }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = () => onCloseRef.current();
  /** Decided when the sheet opens: is another sheet already open beneath it? */
  const [stacked] = useState(() => openSheetCount() > 0);
  useScrollLock();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const id = registerSheet(() => onCloseRef.current());
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus(); // keep an autoFocus field focused
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTopSheet(id)) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unregisterSheet(id);
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={close} aria-hidden />
      <div ref={panelRef} className={cx(styles.panel, size === "full" && styles.full, size === "page" && styles.page, stacked && size !== "page" && styles.stacked)} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className={styles.grabber} aria-hidden />
        <header className={cx(styles.header, onBack && styles.headerBack)}>
          {onBack && <IconButton label="Back" icon={<IconBack />} onClick={onBack} />}
          <div className={styles.titleWrap}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          <div className={styles.actions}>
            {headerAction}
            <IconButton label="Close" icon={<IconClose />} onClick={close} />
          </div>
        </header>
        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
