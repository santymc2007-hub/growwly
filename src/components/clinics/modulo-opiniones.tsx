"use client";

import { useRef } from "react";
import { Star } from "lucide-react";

type Opinion = { autor: string; texto: string; puntuacion?: number };

/**
 * Opiniones en tarjetas horizontales (4 visibles en escritorio, como
 * los módulos de clínica), con scroll lateral con inercia/snap cuando
 * hay más de 4 — más flechas para quien prefiera clicar.
 */
export function ModuloOpiniones({ opiniones }: { opiniones: Opinion[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (opiniones.length === 0) return null;

  function desplazar(direccion: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg text-teal-dark">
        Opiniones de pacientes
      </h2>
      <div className="relative mt-3">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {opiniones.map((opinion, i) => (
            <blockquote
              key={i}
              className="w-[85%] shrink-0 snap-start rounded-xl border border-line bg-white/60 p-4 text-sm sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
            >
              {opinion.puntuacion && (
                <div className="mb-1.5 flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s < opinion.puntuacion!
                          ? "fill-yellow text-yellow"
                          : "fill-transparent text-line"
                      }
                    />
                  ))}
                </div>
              )}
              <p className="break-words text-ink-soft">&ldquo;{opinion.texto}&rdquo;</p>
              <footer className="mt-2 font-medium text-ink">
                — {opinion.autor}
              </footer>
            </blockquote>
          ))}
        </div>

        {opiniones.length > 4 && (
          <>
            <button
              type="button"
              onClick={() => desplazar(-1)}
              aria-label="Opiniones anteriores"
              className="press absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-teal-dark shadow-md transition hover:bg-paper-dim lg:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => desplazar(1)}
              aria-label="Más opiniones"
              className="press absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-teal-dark shadow-md transition hover:bg-paper-dim lg:flex"
            >
              ›
            </button>
          </>
        )}
      </div>
    </section>
  );
}
