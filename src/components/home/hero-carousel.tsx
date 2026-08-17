"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide = {
  antes: string;
  destacado: string;
  despues: string;
  subtitulo: string;
  imagen: string;
  imagenAlt: string;
};

/**
 * TODO Santy: las 5 slides reutilizan hero-persona.png porque es la
 * única imagen de hero que hay en /public/brand — en cuanto tengas
 * fotos/ilustraciones distintas por mensaje, se cambian aquí (campo
 * `imagen` de cada slide). Los textos de las slides 2-5 están
 * inspirados en los 4 pasos de "Cómo funciona" para no inventar
 * mensajes nuevos; dime si quieres otro copy.
 */
const SLIDES: Slide[] = [
  {
    antes: "Tu",
    destacado: "valoración con IA",
    despues: "en un par de clics",
    subtitulo: "¡Ah! Y con presupuesto personalizado",
    imagen: "/brand/hero-persona.png",
    imagenAlt: "Persona haciéndose una foto para el análisis capilar",
  },
  {
    antes: "",
    destacado: "Compara clínicas verificadas",
    despues: "de toda España",
    subtitulo: "Precios, opiniones y técnicas reales, en un solo sitio",
    imagen: "/brand/hero-persona.png",
    imagenAlt: "Persona haciéndose una foto para el análisis capilar",
  },
  {
    antes: "Solicita",
    destacado: "presupuesto",
    despues: "a varias clínicas a la vez",
    subtitulo: "Te contactan las clínicas que mejor encajan contigo",
    imagen: "/brand/hero-persona.png",
    imagenAlt: "Persona haciéndose una foto para el análisis capilar",
  },
  {
    antes: "Recibe",
    destacado: "ofertas",
    despues: "y compara con calma",
    subtitulo: "Las clínicas te envían propuestas adaptadas a tus necesidades",
    imagen: "/brand/hero-persona.png",
    imagenAlt: "Persona haciéndose una foto para el análisis capilar",
  },
  {
    antes: "Reserva tu",
    destacado: "cita",
    despues: "cuando estés list@",
    subtitulo: "Elige la mejor opción y agenda tu intervención de forma segura",
    imagen: "/brand/hero-persona.png",
    imagenAlt: "Persona haciéndose una foto para el análisis capilar",
  },
];

const INTERVALO_MS = 6000;

export function HeroCarousel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % SLIDES.length);
    }, INTERVALO_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[indice];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-sage/40">
      <div className="mx-auto grid items-end gap-6 px-6 pt-8 sm:pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
        <div className="order-1 self-center text-left lg:order-1">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-teal-dark sm:text-5xl lg:text-6xl">
            {slide.antes && <>{slide.antes} </>}
            <span className="inline-block bg-yellow px-2 text-teal-dark">
              {slide.destacado}
            </span>{" "}
            {slide.despues}
          </h1>
          <p className="mt-2 font-display text-lg font-bold text-teal-dark sm:mt-4 sm:text-3xl lg:text-4xl">
            {slide.subtitulo}
          </p>

          {/* En escritorio, el botón y el texto van aquí, junto al titular */}
          <div className="hidden lg:block">
            <Link
              href="/analisis/nuevo"
              className="press mt-8 inline-block w-full max-w-md rounded-full bg-gradient-to-r from-yellow to-orange px-8 py-5 font-display text-xl font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
            >
              Subir fotos
            </Link>
            <p className="mt-4 text-base text-ink-soft">
              Gratis · 2 minutos · No es un diagnóstico médico.
            </p>
          </div>
        </div>

        <div className="order-2 relative -mx-6 aspect-[1114/889] w-full self-end sm:mx-auto sm:max-w-none lg:order-2">
          <Image
            src={slide.imagen}
            alt={slide.imagenAlt}
            fill
            sizes="100vw"
            className="object-contain object-bottom"
            priority={indice === 0}
          />
        </div>

        {/* En móvil, el botón y el texto van debajo de la imagen */}
        <div className="order-3 pb-8 text-left lg:hidden">
          <Link
            href="/analisis/nuevo"
            className="press inline-block w-full max-w-xs rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
          >
            Subir fotos
          </Link>
          <p className="mt-3 text-xs text-ink-soft">
            Gratis · 2 minutos · No es un diagnóstico médico.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-4 pt-6 lg:pt-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
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
