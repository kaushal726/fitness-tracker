import { useState } from "react";
import { deleteCustomFood, useAppState } from "../../data/store.ts";
import { formatNumber, formatPortionText } from "../../lib/format.ts";
import type { Food } from "../../nutrition/types.ts";
import { Button, IconButton } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { EmptyState } from "../../ui/EmptyState";
import { IconBook, IconPlus, IconTrash } from "../../ui/icons";
import { Sheet } from "../../ui/Sheet";
import { useToast } from "../../ui/Toast";
import { CustomFoodForm } from "../add/CustomFoodForm.tsx";
import { FoodTile } from "../add/FoodTile.tsx";
import styles from "./profile.module.css";

interface Props {
  onClose: () => void;
}

/** The foods they made: add one, tap one to change it, or delete it. The form takes the sheet's place, so nothing opens on top. */
export function MyFoodsSheet({ onClose }: Props) {
  const { customFoods } = useAppState();
  const confirm = useConfirm();
  const toast = useToast();
  /** Null shows the list; otherwise the form, for a new food (editing null) or for the one being changed. */
  const [form, setForm] = useState<{ editing: Food | null } | null>(null);

  const remove = async (id: string) => {
    const ok = await confirm({ title: "Delete this food?", message: "Days you already logged with it keep their numbers.", confirmLabel: "Delete", danger: true });
    if (ok) deleteCustomFood(id);
  };

  if (form) {
    return (
      <Sheet open onClose={onClose} onBack={() => setForm(null)} title={form.editing ? "Edit your food" : "Add your own food"} subtitle="Numbers for one serving" size="full">
        <CustomFoodForm
          key={form.editing?.id ?? "new"}
          initialName=""
          editing={form.editing ?? undefined}
          onCreated={() => {
            toast("Food saved");
            setForm(null);
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="My foods"
      subtitle="Foods you added yourself"
      footer={<Button variant="primary" size="lg" block icon={<IconPlus />} onClick={() => setForm({ editing: null })}>Add a food</Button>}
    >
      {customFoods.length === 0 ? (
        <EmptyState icon={<IconBook />} title="No foods of your own" message="Add one here, or choose Add custom food while searching." />
      ) : (
        <ul className={styles.foods}>
          {customFoods.map((f) => (
            <li key={f.id} className={styles.foodRow}>
              <button type="button" className={styles.foodMain} onClick={() => setForm({ editing: f })} aria-label={`Edit ${f.name}`}>
                <FoodTile category="custom" />
                <span className={styles.foodText}>
                  <span className={styles.foodName}>{f.name}</span>
                  <span className={styles.foodMeta}>{formatPortionText(f.servingOptions[0]?.label ?? "")} · {formatNumber(f.nutritionPerServing.calories)} kcal</span>
                </span>
              </button>
              <IconButton label="Delete this food" icon={<IconTrash />} variant="danger" onClick={() => void remove(f.id)} />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
