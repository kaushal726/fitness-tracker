import { cx } from "../lib/cx";
import { NAV_ITEMS, type TabId } from "./navItems";
import styles from "./Dock.module.css";

interface DockProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
}

/** Phones: the places to go, one equal slot each across the whole width. Adding food is the floating button, not part of the bar. */
export function Dock({ active, onSelect }: DockProps) {
  return (
    <nav className={cx(styles.dock, "mobile-only")} aria-label="Main" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={styles.tab} aria-current={id === active ? "page" : undefined} onClick={() => onSelect(id)}>
          <Icon aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}
