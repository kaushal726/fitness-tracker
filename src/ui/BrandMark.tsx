interface BrandMarkProps {
  className?: string;
  /** Lets the opening animation draw the plus on its own. */
  plusClassName?: string;
}

/** The app's mark: a leaf with a plus. White on a brand-coloured background. */
export function BrandMark({ className, plusClassName }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="150 56 212 332" role="presentation" aria-hidden>
      <path d="M256 138c-52 0-94 34-94 92 0 74 52 144 94 144s94-70 94-144c0-58-42-92-94-92z" fill="#ffffff" />
      <path d="M256 138c0-38 22-62 58-70-2 36-20 62-58 70z" fill="#b9e6cf" />
      <path className={plusClassName} d="M256 196v138M212 264h88" fill="none" stroke="#1f6f54" strokeWidth="26" strokeLinecap="round" />
    </svg>
  );
}
