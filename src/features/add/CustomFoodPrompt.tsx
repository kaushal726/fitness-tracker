import { Button } from "../../ui/Button";
import { IconEdit } from "../../ui/icons";
import styles from "./CustomFoodPrompt.module.css";

/** Under a list that may not hold what they ate: the way to add it themselves. */
export function CustomFoodPrompt({ onClick }: { onClick: () => void }) {
  return (
    <div className={styles.prompt}>
      <p>Can't find your food?</p>
      <Button icon={<IconEdit />} onClick={onClick}>Add custom food</Button>
    </div>
  );
}
