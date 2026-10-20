import Image from "next/image";
import Link from "next/link";
import { CARACTERISTICAS } from "@/components/analisis/sellos-confianza";

export function Hero() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-2.5 pb-10 sm:py-[26px]">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="entra text-xs font-bold uppercase tracking-widest text-teal">
            Tu salud capilar en buenas manos
          </p>
          <h1 className="entra d1 mt-3 font-display text-[32px] font-extrabold leading-[1.1] text-teal-dark sm:text-[44px] lg:text-[52px]">
            Tu valoración capilar gratis en 2&nbsp;minutos
          </h1>
          <p className="entra d2 mx-auto mt-4 max-w-md text-base text-ink-soft sm:text-lg lg:mx-0">
            Sube tus fotos, recibe una <strong className="text-ink">valoración con IA</strong>{" "}
            desde cualquier sitio <strong className="text-ink">sin tener que desplazarte</strong>{" "}
            y recibe presupuestos de clínicas especializadas
          </p>

          <Link
            href="/analisis/nuevo"
            className="entra d3 press mt-6 inline-block rounded-full bg-yellow px-6 py-3.5 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
          >
            Haz tu valoración gratuita →
          </Link>
          <p className="entra d3 mt-3 text-sm text-ink-soft">
            Gratis · 2 minutos · No es un diagnóstico médico.
          </p>

          {/* Mismos iconos que la página de valoración (sellos-confianza),
              en versión compacta: icono encima y texto debajo. */}
          <div className="entra d4 mx-auto mt-8 grid max-w-md grid-cols-4 gap-2 sm:gap-4 lg:mx-0">
            {CARACTERISTICAS.map(({ icono, texto, w, h }) => (
              <div key={texto} className="flex flex-col items-center gap-2 text-center">
                <Image
                  src={icono}
                  alt=""
                  width={w}
                  height={h}
                  className="h-7 w-auto shrink-0 sm:h-8"
                />
                <span className="text-[11px] font-semibold leading-tight text-teal-dark sm:text-xs">
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="entra relative order-1 -mx-6 aspect-[1140/894] w-[calc(100%+3rem)] sm:mx-auto sm:w-full sm:max-w-[840px] lg:order-2">
          <Image
            src="/brand/hero-analisis-ia.png"
            alt="Análisis capilar con IA a partir de una foto"
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
