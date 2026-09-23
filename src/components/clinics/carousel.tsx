"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";

type Props = {
  fotos: string[];
  nombreClinica: string;
  autoplayMs?: number;
};

/**
 * Escritorio: cuadrícula de miniaturas (todas las fotos a la vez, sin
 * autoplay — ocupa menos espacio vertical que una foto grande). Clicar
 * cualquiera abre el visor a pantalla completa en esa foto.
 *
 * Móvil/tablet: una foto a la vez con autoplay y transición simple,
 * más flechas y puntos — el espacio vertical no es un problema ahí.
 *
 * El visor (modal) es común a ambos: flechas, deslizar con el dedo, y
 * se cierra con la X o tocando fuera de la foto.
 */
export function Carousel({ fotos, nombreClinica, autoplayMs = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const count = fotos.length;
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (count <= 1 || modalAbierto) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), autoplayMs);
    return () => clearInterval(t);
  }, [count, autoplayMs, modalAbierto]);

  // Con el modal abierto, la página de detrás no debe poder hacer
  // scroll — sin esto, en Safari de iPhone el fondo se mueve por
  // debajo del overlay y la barra de direcciones se comporta raro.
  useEffect(() => {
    if (!modalAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [modalAbierto]);

  if (count === 0) return null;

  const anterior = () => setIndex((i) => (i - 1 + count) % count);
  const siguiente = () => setIndex((i) => (i + 1) % count);

  function abrir(i: number) {
    setIndex(i);
    setModalAbierto(true);
  }

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) siguiente();
    else anterior();
  }

  const flecha = (dir: "izq" | "der", onClick: () => void) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={dir === "izq" ? "Anterior" : "Siguiente"}
      className={`press absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-teal-dark shadow-md transition hover:bg-white ${
        dir === "izq" ? "left-3" : "right-3"
      }`}
    >
      {dir === "izq" ? "‹" : "›"}
    </button>
  );

  return (
    <>
      {/* Escritorio: miniaturas */}
      <div className="hidden gap-2 lg:grid lg:grid-cols-4">
        {fotos.map((foto, i) => (
          <button
            key={`${foto}-${i}`}
            type="button"
            onClick={() => abrir(i)}
            className="press group relative aspect-square overflow-hidden rounded-xl bg-sage"
            aria-label={`Ver foto ${i + 1} en grande`}
          >
            <Image
              src={foto}
              alt={`${nombreClinica} foto ${i + 1}`}
              fill
              sizes="200px"
              className="object-cover transition duration-300 group-hover:scale-105"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

      {/* Móvil/tablet: carrusel con autoplay */}
      <div className="lg:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => abrir(index)}
            className="block w-full cursor-zoom-in"
            aria-label="Ver más grande"
          >
            <div
              key={index}
              className="carousel-fade relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-sage"
            >
              <Image
                src={fotos[index]}
                alt={`${nombreClinica} foto ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          </button>
          {count > 1 && (
            <>
              {flecha("izq", anterior)}
              {flecha("der", siguiente)}
              <div className="mt-2 flex justify-center gap-1.5">
                {fotos.map((_, i) => (
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
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setModalAbierto(false)}
            className="absolute inset-0 bg-ink/85"
          />
          {/* Fijo respecto al overlay, no a la foto: así siempre queda
              en la esquina de la pantalla, sea cual sea el tamaño o
              proporción de la imagen. Y con área de toque real
              (40x40px), no solo el texto pequeño de antes. */}
          <button
            type="button"
            onClick={() => setModalAbierto(false)}
            aria-label="Cerrar"
            className="press absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg text-ink shadow-md hover:bg-white"
          >
            ✕
          </button>
          <div
            className="modal-anim relative z-10 w-full max-w-4xl"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              key={index}
              className="carousel-fade relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black"
            >
              <Image
                src={fotos[index]}
                alt={`${nombreClinica} foto ${index + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            {count > 1 && (
              <>
                {flecha("izq", anterior)}
                {flecha("der", siguiente)}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
