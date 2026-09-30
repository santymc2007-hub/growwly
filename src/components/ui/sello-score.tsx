import Image from "next/image";

/**
 * Sellos gráficos de Match Score y Growwly Score. La imagen lleva la
 * píldora vacía y el número se pinta encima, así el valor es siempre
 * el real. Las posiciones son el centro de la píldora en cada imagen.
 */
const SELLOS = {
  match: { src: "/brand/sello-match-score.png", alt: "Match Score", x: 50.5, y: 87 },
  growwly: { src: "/brand/sello-growwly-score.png", alt: "Growwly Score", x: 50.3, y: 87 },
} as const;

export function SelloScore({
  tipo,
  valor,
  size = 96,
}: {
  tipo: keyof typeof SELLOS;
  valor: number;
  size?: number;
}) {
  const s = SELLOS[tipo];
  const numero = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${s.alt}: ${numero}`}
    >
      <Image src={s.src} alt="" fill sizes={`${size}px`} className="object-contain" />
      <span
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-1/2 font-display font-extrabold leading-none tracking-tight text-[#0a2f2a]"
        style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: size * (numero === 100 ? 0.13 : 0.16) }}
      >
        {numero}
      </span>
    </div>
  );
}
