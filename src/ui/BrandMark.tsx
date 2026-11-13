interface BrandMarkProps {
  className?: string;
}

/** The app's icon, the same file the browser and the home screen use. The caller sizes it and rounds its corners. */
export function BrandMark({ className }: BrandMarkProps) {
  return <img className={className} src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" aria-hidden draggable={false} />;
}
