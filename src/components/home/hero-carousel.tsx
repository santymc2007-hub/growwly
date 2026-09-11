"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/supabase/database.types";

const INTERVALO_MS = 6000;

export function HeroCarousel({
  slides,
  children,
}: {
  slides: HeroSlide[];
  /** La cabecera (SiteHeader), pasada desde el Server Component padre —
   * se pinta aquí dentro para que comparta el mismo fondo que la slide
   * activa, como un <style> de React normal (sin variables CSS de por
   * medio, para que no se pueda quedar "pegado" a un color viejo). */
  children?: ReactNode;
}) {
  const [indice, setIndice] = useState(0);
  const slide = slides[indice] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % slides.length);
    }, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return <>{children}</>;

  function anterior() {
    setIndice((i) => (i - 1 + slides.length) % slides.length);
  }
  function siguiente() {
    setIndice((i) => (i + 1) % slides.length);
  }

  return (
    <div style={{ backgroundColor: slide.color_fondo || "#1f5568" }}>
      {children}

      <div className="relative">
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

        <div className="mx-auto grid max-w-[1600px] items-end gap-6 px-6 pb-10 pt-6 sm:pb-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:pb-16">
          <div className="order-1 self-center text-left lg:order-1">
            <h1
              className="font-display text-[28px] font-extrabold leading-tight text-white sm:text-[44px] lg:text-[56px]"
              dangerouslySetInnerHTML={{ __html: slide.titular_html }}
            />
            {slide.subtitulo && (
              <p className="mt-2 font-display text-[16px] font-bold text-white/80 sm:mt-4 sm:text-[28px] lg:text-[34px]">
                {slide.subtitulo}
              </p>
            )}

            <div className="hidden lg:block">
              <Link
                href={slide.enlace}
                className="press mt-8 inline-block rounded-full bg-gradient-to-r from-yellow to-orange px-8 py-4 font-display text-lg font-bold uppercase tracking-wide text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
              >
                {slide.texto_boton}
              </Link>
              <p className="mt-4 text-base text-white/70">
                Gratis · 2 minutos · No es un diagnóstico médico.
              </p>
            </div>
          </div>

          <div className="order-2 relative aspect-[1114/889] w-full self-end sm:mx-auto sm:max-w-none lg:order-2">
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

          <div className="order-3 text-left lg:hidden">
            <Link
              href={slide.enlace}
              className="press inline-block rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
            >
              {slide.texto_boton}
            </Link>
            <p className="mt-3 text-xs text-white/70">
              Gratis · 2 minutos · No es un diagnóstico médico.
            </p>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pb-6">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ir a la slide ${i + 1}`}
                aria-current={i === indice}
                className={`press h-2 rounded-full transition-all ${
                  i === indice ? "w-6 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
