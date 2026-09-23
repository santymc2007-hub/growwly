import { AntesDespuesSlider } from "./antes-despues-slider";

/**
 * Muestra todos los pares antes/después subidos a la vez, en
 * cuadrícula — cada uno con su propio comparador de arrastre y, si
 * la tiene, una breve descripción del caso.
 */
export function AntesDespuesGaleria({
  pares,
  nombreClinica,
}: {
  pares: { antes: string; despues: string; descripcion?: string }[];
  nombreClinica: string;
}) {
  if (pares.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {pares.map((par, i) => (
        <div key={i}>
          <AntesDespuesSlider
            antes={par.antes}
            despues={par.despues}
            alt={`${nombreClinica} — caso ${i + 1}`}
          />
          {par.descripcion && (
            <p className="mt-2 text-xs text-ink-soft">{par.descripcion}</p>
          )}
        </div>
      ))}
    </div>
  );
}
