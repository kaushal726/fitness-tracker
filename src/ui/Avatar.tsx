import styles from "./Avatar.module.css";

/** The first letter of a name in a soft tile. */
export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {initial || "•"}
    </span>
  );
}
