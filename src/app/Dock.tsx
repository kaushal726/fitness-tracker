import { cx } from "../lib/cx";
import { IconPlus } from "../ui/icons";
import { NAV_ITEMS, type TabId } from "./navItems";
import styles from "./Dock.module.css";

interface DockProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
  onAdd: () => void;
}

/** Phones: the three places to go, and the one thing you do most, always within thumb reach. */
export function Dock({ active, onSelect, onAdd }: DockProps) {
  return (
    <nav className={cx(styles.dock, "mobile-only")} aria-label="Main">
      <div className={styles.tabs}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={styles.tab} aria-current={id === active ? "page" : undefined} onClick={() => onSelect(id)}>
            <Icon aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <button type="button" className={styles.add} onClick={onAdd}>
        <IconPlus aria-hidden />
        Add food
      </button>
    </nav>
  );
}
