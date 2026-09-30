import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { IconSearch } from "../../ui/icons";
import { FoodListSkeleton } from "./FoodListSkeleton.tsx";
import type { FoodsStatus } from "./useFoods.ts";

interface Props {
  status: Exclude<FoodsStatus, "ready">;
  onRetry: () => void;
  rows?: number;
}

/** What a list shows while the food data is on its way, or when it could not be fetched. */
export function FoodsNotReady({ status, onRetry, rows }: Props) {
  if (status === "failed") {
    return <EmptyState icon={<IconSearch />} title="Couldn't load the foods" message="Check your connection and try again." action={<Button onClick={onRetry}>Try again</Button>} />;
  }
  return <FoodListSkeleton rows={rows} />;
}
