"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroSlide } from "@/lib/supabase/database.types";

const INTERVALO_MS = 6000;
// Alto de la zona de color del hero — sube por tramos con el viewport
// porque en móvil el contenido (apilado en una sola columna) es mucho
// más bajo que en escritorio; con un valor fijo de 600px la banda se
// salía por arriba, incluso por encima de la cabecera. En lg SÍ llega
// a los 600px pedidos, que es donde la foto es más alta que la banda.
const ALTURA_BANDA_CLASES = "h-[220px] sm:h-[320px] md:h-[420px] lg:h-[600px]";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % slides.length);
    }, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[indice] ?? slides[0];

  function anterior() {
    setIndice((i) => (i - 1 + slides.length) % slides.length);
  }
  function siguiente() {
    setIndice((i) => (i + 1) % slides.length);
  }

  return (
    <div>
      <div className="relative">
        {/* Banda de color anclada abajo, alto responsive (ver constante
            arriba). Sin overflow-hidden: la foto puede sobresalir por
            encima sin recortarse. */}
        <div
          className={`absolute inset-x-0 bottom-0 rounded-3xl ${ALTURA_BANDA_CLASES}`}
          style={{ backgroundColor: slide.color_fondo || "#ecf7f1" }}
          aria-hidden
        />

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Slide anterior"
              className="press absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-teal-dark shadow-md transition hover:bg-white sm:left-4 sm:p-2.5"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Slide siguiente"
              className="press absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-teal-dark shadow-md transition hover:bg-white sm:right-4 sm:p-2.5"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}

        <div className="relative mx-auto grid items-end gap-6 px-6 pt-8 sm:pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
          <div className="order-1 self-center text-left lg:order-1">
            <h1
              className="font-display text-[20px] font-extrabold leading-tight text-teal-dark sm:text-[44px] lg:text-[56px]"
              dangerouslySetInnerHTML={{ __html: slide.titular_html }}
            />
            {slide.subtitulo && (
              <p className="mt-2 font-display text-[16px] font-bold text-teal-dark opacity-80 sm:mt-4 sm:text-[28px] lg:text-[34px]">
                {slide.subtitulo}
              </p>
            )}

            {/* En escritorio, el botón y el texto van aquí, junto al titular */}
            <div className="hidden lg:block">
              <Link
                href={slide.enlace}
                className="press mt-8 inline-block w-full max-w-md rounded-xl bg-gradient-to-r from-yellow to-orange px-8 py-5 font-display text-xl font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
              >
                {slide.texto_boton}
              </Link>
              <p className="mt-4 text-base text-ink-soft">
                Gratis · 2 minutos · No es un diagnóstico médico.
              </p>
            </div>
          </div>

          <div className="order-2 relative -mx-6 aspect-[1114/889] w-full self-end sm:mx-auto sm:max-w-none lg:order-2">
            {slide.imagen_url && (
              <Image
                src={slide.imagen_url}
                alt={slide.titular_html.replace(/<[^>]+>/g, "")}
                fill
                sizes="100vw"
                className="object-contain object-bottom"
                priority={indice === 0}
              />
            )}
          </div>

          {/* En móvil, el botón y el texto van debajo de la imagen */}
          <div className="order-3 pb-8 text-left lg:hidden">
            <Link
              href={slide.enlace}
              className="press inline-block w-full max-w-xs rounded-xl bg-gradient-to-r from-yellow to-orange px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
            >
              {slide.texto_boton}
            </Link>
            <p className="mt-3 text-xs text-ink-soft">
              Gratis · 2 minutos · No es un diagnóstico médico.
            </p>
          </div>
        </div>
      </div>

      {/* Paginador fuera de la zona de color, ya en blanco. Se muestra
          siempre, incluso con 1 sola slide (antes se ocultaba con
          slides.length > 1 y por eso "no aparecía" con solo 1 activa). */}
      <div className="flex items-center justify-center gap-1.5 pt-6">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ir a la slide ${i + 1}`}
            aria-current={i === indice}
            className={`press h-2 rounded-full transition-all ${
              i === indice ? "w-6 bg-teal-dark" : "w-2 bg-teal-dark/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
