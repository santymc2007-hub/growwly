import { AntesDespuesSlider } from "./antes-despues-slider";

/**
 * Muestra todos los pares antes/después subidos a la vez, en
 * cuadrícula — cada uno con su propio comparador de arrastre.
 */
export function AntesDespuesGaleria({
  pares,
  nombreClinica,
}: {
  pares: { antes: string; despues: string }[];
  nombreClinica: string;
}) {
  if (pares.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {pares.map((par, i) => (
        <AntesDespuesSlider
          key={i}
          antes={par.antes}
          despues={par.despues}
          alt={`${nombreClinica} — caso ${i + 1}`}
        />
      ))}
    </div>
  );
}
