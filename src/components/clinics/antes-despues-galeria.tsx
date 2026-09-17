"use client";

import { useState } from "react";
import { AntesDespuesSlider } from "./antes-despues-slider";

/**
 * Varios pares antes/después con su propio paginador (no el Carousel
 * genérico: ese envuelve cada slide en un botón que abre un modal al
 * clicar en cualquier punto, lo que chocaría con arrastrar el
 * comparador dentro de la propia miniatura).
 */
export function AntesDespuesGaleria({
  pares,
  nombreClinica,
}: {
  pares: { antes: string; despues: string }[];
  nombreClinica: string;
}) {
  const [index, setIndex] = useState(0);
  const count = pares.length;

  if (count === 0) return null;

  const anterior = () => setIndex((i) => (i - 1 + count) % count);
  const siguiente = () => setIndex((i) => (i + 1) % count);

  return (
    <div className="relative max-w-md">
      <AntesDespuesSlider
        key={index}
        antes={pares[index].antes}
        despues={pares[index].despues}
        alt={`${nombreClinica} — caso ${index + 1}`}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Caso anterior"
            className="press absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-teal-dark shadow-md transition hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Caso siguiente"
            className="press absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-teal-dark shadow-md transition hover:bg-white"
          >
            ›
          </button>
          <div className="mt-2 flex justify-center gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al caso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-teal-dark" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
