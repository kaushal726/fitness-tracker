import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { foodsLoaded, loadFoods, onFoodsLoaded } from "../../nutrition/registry.ts";

export type FoodsStatus = "loading" | "ready" | "failed";

/** Whether the food data has arrived. Asks for it on first use, and offers a retry when the download failed. */
export function useFoods(): { status: FoodsStatus; retry: () => void } {
  const ready = useSyncExternalStore(onFoodsLoaded, foodsLoaded);
  const [failed, setFailed] = useState(false);

  const request = useCallback(() => {
    setFailed(false);
    loadFoods().catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!ready) request();
  }, [ready, request]);

  return { status: ready ? "ready" : failed ? "failed" : "loading", retry: request };
}
