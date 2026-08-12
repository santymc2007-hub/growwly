"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  slides: ReactNode[];
  slidesGrandes?: ReactNode[];
  autoplayMs?: number;
};

export function Carousel({ slides, slidesGrandes, autoplayMs = 3000 }: Props) {
  const [index, setIndex] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const count = slides.length;
  const grandes = slidesGrandes ?? slides;

  useEffect(() => {
    if (count <= 1 || modalAbierto) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), autoplayMs);
    return () => clearInterval(t);
  }, [count, autoplayMs, modalAbierto]);

  if (count === 0) return null;

  const anterior = () => setIndex((i) => (i - 1 + count) % count);
  const siguiente = () => setIndex((i) => (i + 1) % count);

  const flecha = (dir: "izq" | "der", onClick: () => void) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={dir === "izq" ? "Anterior" : "Siguiente"}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-teal-dark shadow-md transition hover:bg-white ${
        dir === "izq" ? "left-3" : "right-3"
      }`}
    >
      {dir === "izq" ? "‹" : "›"}
    </button>
  );

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="block w-full cursor-zoom-in"
          aria-label="Ver más grande"
        >
          {slides[index]}
        </button>
        {count > 1 && (
          <>
            {flecha("izq", anterior)}
            {flecha("der", siguiente)}
            <div className="mt-2 flex justify-center gap-1.5">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-teal-dark" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setModalAbierto(false)}
            className="absolute inset-0 bg-ink/85"
          />
          <div className="relative z-10 w-full max-w-4xl">
            {grandes[index]}
            {count > 1 && (
              <>
                {flecha("izq", anterior)}
                {flecha("der", siguiente)}
              </>
            )}
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="absolute -top-10 right-0 text-sm font-medium text-white hover:opacity-80"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
