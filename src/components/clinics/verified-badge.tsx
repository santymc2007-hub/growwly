type VerifiedBadgeProps = {
  /** "photo" = pill blanca con sombra, para superponer sobre una foto.
   *  "inline" = pill en verde salvia, para usar sobre fondo de página. */
  variant?: "photo" | "inline";
  className?: string;
};

export function VerifiedBadge({
  variant = "inline",
  className = "",
}: VerifiedBadgeProps) {
  const styles =
    variant === "photo"
      ? "bg-white/95 text-ink shadow-sm"
      : "bg-sage text-sage-ink";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 text-green"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
      Verificada
    </span>
  );
}
