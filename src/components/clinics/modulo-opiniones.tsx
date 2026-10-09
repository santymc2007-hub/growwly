"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";
import { GoogleG } from "./modulo-valoraciones";

type Opinion = { autor: string; texto: string; puntuacion?: number };

// A partir de aquí el texto es tan largo que merece un "leer más" en
// vez de dejar crecer la tarjeta (y con ella, por "align-items: stretch"
// del flex, todas las demás de la misma fila).
const UMBRAL_LEER_MAS = 170;

function TarjetaOpinion({ opinion }: { opinion: Opinion }) {
  const [expandida, setExpandida] = useState(false);
  const esLarga = opinion.texto.length > UMBRAL_LEER_MAS;

  return (
    <blockquote className="w-[85%] shrink-0 snap-start rounded-xl border border-line bg-white/60 p-4 text-sm sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
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
      <p className={`break-words text-ink-soft ${!expandida && esLarga ? "line-clamp-4" : ""}`}>
        &ldquo;{opinion.texto}&rdquo;
      </p>
      {esLarga && (
        <button
          type="button"
          onClick={() => setExpandida((v) => !v)}
          className="mt-1 text-xs font-medium text-cyan-dark hover:underline"
        >
          {expandida ? "Leer menos" : "Leer más"}
        </button>
      )}
      <footer className="mt-2 font-medium text-ink">— {opinion.autor}</footer>
    </blockquote>
  );
}

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
      <h2 className="flex items-center gap-2 font-display text-lg text-teal-dark">
        <GoogleG />
        Qué opinan nuestros clientes
      </h2>
      <div className="relative mt-3">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {opiniones.map((opinion, i) => (
            <TarjetaOpinion key={i} opinion={opinion} />
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
