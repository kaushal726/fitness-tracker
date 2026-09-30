import { toggleFavorite, useAppState } from "../../data/store.ts";
import { cx } from "../../lib/cx.ts";
import { IconButton } from "../../ui/Button";
import { IconStar } from "../../ui/icons";
import styles from "./FavoriteButton.module.css";

/** The star in a food's header: keeps it among the person's favourites. */
export function FavoriteButton({ foodId }: { foodId: string }) {
  const { favorites } = useAppState();
  const isFavorite = favorites.includes(foodId);
  return (
    <IconButton
      label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      icon={<IconStar className={cx(isFavorite && styles.on)} />}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(foodId)}
    />
  );
}
