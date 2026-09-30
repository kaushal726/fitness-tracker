import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "soft" | "secondary" | "outline" | "ghost" | "danger" | "dangerSolid";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", block, icon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={cx(styles.button, styles[variant], styles[size], block && styles.block, className)} {...rest}>
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
}

/** Icon-only: the label is what a screen reader says and what the tooltip shows. */
export function IconButton({ label, icon, variant = "ghost", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cx(styles.button, styles[variant], styles.iconOnly, className)} {...rest}>
      <span className={styles.icon} aria-hidden>{icon}</span>
    </button>
  );
}
