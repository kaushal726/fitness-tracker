import { deleteCustomFood, useAppState } from "../../data/store.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import { IconButton } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { EmptyState } from "../../ui/EmptyState";
import { IconBook, IconTrash } from "../../ui/icons";
import { Sheet } from "../../ui/Sheet";
import { FoodTile } from "../add/FoodTile.tsx";
import styles from "./profile.module.css";

interface Props {
  onClose: () => void;
}

export function MyFoodsSheet({ onClose }: Props) {
  const { customFoods } = useAppState();
  const confirm = useConfirm();

  const remove = async (id: string, name: string) => {
    const ok = await confirm({ title: `Delete ${name}?`, message: "Days you already logged with it keep their numbers.", confirmLabel: "Delete", danger: true });
    if (ok) deleteCustomFood(id);
  };

  return (
    <Sheet open onClose={onClose} title="My foods" subtitle="Foods you added yourself">
      {customFoods.length === 0 ? (
        <EmptyState icon={<IconBook />} title="No foods of your own" message="When a food is missing, choose Add custom food while searching." />
      ) : (
        <ul className={styles.foods}>
          {customFoods.map((f) => (
            <li key={f.id} className={styles.foodRow}>
              <FoodTile category="custom" />
              <span className={styles.foodText}>
                <span className={styles.foodName}>{f.name}</span>
                <span className={styles.foodMeta}>{formatPortionText(f.servingOptions[0]?.label ?? "")} · {formatNumber(f.nutritionPerServing.calories)} kcal</span>
              </span>
              <IconButton label={`Delete ${f.name}`} icon={<IconTrash />} variant="danger" onClick={() => remove(f.id, f.name)} />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
