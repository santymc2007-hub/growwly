import Image from "next/image";
import Link from "next/link";
import { Zap, Wallet, ShieldCheck } from "lucide-react";

const BADGES = [
  { icono: Zap, texto: "Rápido y fácil" },
  { icono: Wallet, texto: "100% Gratuito" },
  { icono: ShieldCheck, texto: "Clínicas verificadas" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sage/25 via-sage/10 to-white">
      <Image
        src="/brand/textura-hojas.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover opacity-70"
      />
      <div className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6 lg:py-16">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-teal">
            Tu pelo en buenas manos
          </p>
          <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[1.1] text-teal-dark sm:text-[44px] lg:text-[52px]">
            Tu valoración capilar gratis en 1&nbsp;minuto
          </h1>
          <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
            Sube tus fotos, recibe una <strong className="text-ink">valoración con IA</strong>{" "}
            desde cualquier sitio <strong className="text-ink">sin tener que desplazarte</strong>{" "}
            y recibe presupuestos de clínicas especializadas
          </p>

          <Link
            href="/analisis/nuevo"
            className="press mt-6 inline-block rounded-full bg-yellow px-6 py-3.5 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
          >
            Haz tu valoración gratuita →
          </Link>
          <p className="mt-3 text-sm text-ink-soft">
            Gratis · 2 minutos · No es un diagnóstico médico.
          </p>

          <div className="mt-8 flex gap-6 sm:gap-8">
            {BADGES.map(({ icono: Icono, texto }) => (
              <div key={texto} className="flex flex-col items-center gap-2 text-center">
                <Icono className="text-teal-dark" size={22} aria-hidden />
                <span className="max-w-[7rem] text-xs font-semibold text-teal-dark">
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto aspect-[1416/1111] w-full max-w-2xl">
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
