import { IconClose, IconSearch } from "./icons";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder, autoFocus }: SearchInputProps) {
  return (
    <div className={styles.search}>
      <IconSearch className={styles.icon} aria-hidden />
      <input
        className={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => onChange("")}>
          <IconClose />
        </button>
      )}
    </div>
  );
}
