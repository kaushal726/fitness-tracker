import { Chip } from "../../ui/Chip";
import { SectionLabel } from "../../ui/SectionLabel";
import { CategoryGrid } from "./CategoryGrid.tsx";
import { FoodCard, FoodRows } from "./FoodRows.tsx";
import type { FoodPicker } from "./useFoodPicker.ts";
import type { FoodBrowser } from "./useFoodSearch.ts";
import listStyles from "./FoodList.module.css";
import styles from "./BrowseView.module.css";

interface Props {
  browser: FoodBrowser;
  picker: FoodPicker;
  onPickCategory: (category: string) => void;
}

/** Before anything is typed: shortcuts to what gets eaten most, favourites, what was added lately, and every category. */
export function BrowseView({ browser, picker, onPickCategory }: Props) {
  const quickOpen = browser.quick.find((f) => picker.isOpen("quick", f));

  return (
    <>
      <SectionLabel>Common foods</SectionLabel>
      <div className="scroll-row">
        {browser.quick.map((f) => <Chip key={f.id} selected={picker.isOpen("quick", f)} onClick={() => picker.toggle("quick", f)}>{f.name}</Chip>)}
      </div>
      {quickOpen && (
        <div className={`${listStyles.card} ${styles.quickCard}`}>
          <FoodCard key={quickOpen.id} food={quickOpen} picker={picker} />
        </div>
      )}
      {browser.favorites.length > 0 && (
        <>
          <SectionLabel>Favourites</SectionLabel>
          <FoodRows slot="favorites" foods={browser.favorites} picker={picker} />
        </>
      )}
      {browser.recent.length > 0 && (
        <>
          <SectionLabel>Recently added</SectionLabel>
          <FoodRows slot="recent" foods={browser.recent} picker={picker} />
        </>
      )}
      <SectionLabel>Browse</SectionLabel>
      <CategoryGrid onPick={onPickCategory} />
    </>
  );
}
