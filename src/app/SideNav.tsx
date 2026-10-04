import { cx } from "../lib/cx";
import { BrandMark } from "../ui/BrandMark";
import { IconPlus } from "../ui/icons";
import { MadeWithLove } from "../ui/MadeWithLove";
import { APP_NAME } from "./brand";
import { NAV_ITEMS, type TabId } from "./navItems";
import styles from "./SideNav.module.css";

interface SideNavProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
  onAdd: () => void;
}

/** Wide screens: the same places and the same one big action, down the left side. */
export function SideNav({ active, onSelect, onAdd }: SideNavProps) {
  return (
    <nav className={cx(styles.nav, "desktop-only")} aria-label="Main">
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden><BrandMark className={styles.mark} /></span>
        <span className={styles.brandName}>{APP_NAME}</span>
      </div>
      <button type="button" className={styles.add} onClick={onAdd} aria-label="Add food">
        <IconPlus aria-hidden />
        Add
      </button>
      <div className={styles.items}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={styles.item} aria-current={id === active ? "page" : undefined} onClick={() => onSelect(id)}>
            <Icon aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <footer className={styles.foot}>
        <MadeWithLove />
        <p className={styles.version}>Version {__APP_VERSION__}</p>
      </footer>
    </nav>
  );
}
