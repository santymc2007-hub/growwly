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
    <section className="mx-auto max-w-[1600px] px-6 py-10 sm:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-teal">
            Tu pelo en buenas manos
          </p>
          <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[1.1] text-teal-dark sm:text-[44px] lg:text-[52px]">
            Tu valoración capilar gratis en 1&nbsp;minuto
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-ink-soft sm:text-lg lg:mx-0">
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

          <div className="mt-8 flex justify-center gap-6 sm:gap-8 lg:justify-start">
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

        <div className="relative order-1 mx-auto aspect-[1140/894] w-full max-w-[840px] lg:order-2">
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
