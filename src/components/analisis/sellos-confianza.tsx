import Image from "next/image";

// width/height = tamaño real del icono (viewBox del svg), para que el
// navegador escale manteniendo su proporción en vez de forzarlo a un
// cuadrado y deformarlo.
export const CARACTERISTICAS = [
  { icono: "/analisis/ic-rapido.svg", texto: "Rápido y fácil", w: 34, h: 63 },
  { icono: "/analisis/ic-verificado.svg", texto: "Centros verificados", w: 56, h: 53 },
  { icono: "/analisis/ic-gratuito.svg", texto: "100% Gratuito", w: 44, h: 63 },
  { icono: "/analisis/ic-seguro.svg", texto: "Seguro y confidencial", w: 63, h: 60 },
] as const;

/** Franja de iconos de confianza (subir fotos y adelanto de la valoración).
 *  Los mismos iconos se usan en la home, bajo el CTA (ver hero.tsx). */
export function SellosConfianza() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl bg-paper-dim px-6 py-6 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-10 lg:flex-nowrap lg:divide-x lg:divide-line">
      {CARACTERISTICAS.map(({ icono, texto, w, h }) => (
        <div key={texto} className="flex items-center gap-3 lg:flex-1 lg:justify-center lg:px-6">
          <Image src={icono} alt="" width={w} height={h} className="h-7 w-auto shrink-0 sm:h-9 lg:h-10" />
          <span className="text-sm font-bold text-teal-dark lg:whitespace-nowrap lg:text-base">
            {texto}
          </span>
        </div>
      ))}
    </div>
  );
}
