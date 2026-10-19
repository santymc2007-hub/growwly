import Link from "next/link";
import { Check, X } from "lucide-react";
import { PRECIO_MENSUAL } from "@/lib/visibilidad/tipos";

const INCLUYE_BASICO = [
  "Ficha en el directorio de Growwly",
  "Datos básicos: ubicación, horario, técnicas e idiomas",
  "Nota y reseñas de Google, automáticas",
  "Estadísticas básicas: impresiones, vistas y contactos",
];

const NO_INCLUYE_BASICO = [
  "Reparto automático de pacientes (leads)",
  "Ficha ampliada: fotos antes/después, vídeo, equipo, certificados",
  "Estadísticas de leads y conversión",
];

const INCLUYE_PREMIUM = [
  "Reparto automático de pacientes",
  "Ficha completa: descripción, servicios, vídeo y fotos antes/después",
  "Equipo médico, certificados, redes sociales y reserva online",
  "Estadísticas de leads, tasa de elección y estado de cada paciente",
  'Insignia de "perfil detallado" visible en el listado',
];

/**
 * Comparativa Básico vs Premium — compartida entre /precios y el
 * registro de centro, para que ambas muestren siempre el mismo
 * contenido sin duplicarlo.
 */
export function TarjetasPlanes({
  hrefBasico = "/clinica/registro",
}: {
  hrefBasico?: string;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-stretch justify-center gap-7">
      {/* Básico */}
      <div className="flex min-w-[320px] flex-1 flex-col gap-6 rounded-3xl border border-line bg-white p-8 shadow-[0_8px_28px_-12px_rgba(31,58,46,0.12)]">
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Básico
          </span>
          <span className="font-display text-4xl font-extrabold text-teal-dark">
            Gratis
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            Para que te encuentren en el directorio desde el primer día. Sin
            coste, sin compromiso.
          </p>
        </div>

        <Link
          href={hrefBasico}
          className="press block rounded-full border-2 border-teal-dark px-5 py-3 text-center text-sm font-bold text-teal-dark transition hover:bg-teal-dark/5"
        >
          Publicar mi ficha gratis
        </Link>

        <div className="h-px bg-line" />

        <div className="flex flex-col gap-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Incluye
          </p>
          {INCLUYE_BASICO.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage">
                <Check size={12} strokeWidth={3} className="text-sage-ink" aria-hidden />
              </span>
              <span className="text-sm leading-snug text-ink">{item}</span>
            </div>
          ))}

          <p className="mt-2.5 text-xs font-bold uppercase tracking-wide text-ink-soft">
            No incluye
          </p>
          {NO_INCLUYE_BASICO.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-dim">
                <X size={11} strokeWidth={3} className="text-ink-soft" aria-hidden />
              </span>
              <span className="text-sm leading-snug text-ink-soft">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Premium */}
      <div className="relative flex min-w-[320px] flex-1 flex-col gap-6 rounded-3xl bg-teal-dark p-8 shadow-[0_20px_40px_-16px_rgba(31,58,46,0.35)]">
        <span className="absolute -top-3.5 right-8 rounded-full bg-orange px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-teal-dark shadow-[0_6px_16px_-4px_rgba(255,186,31,0.6)]">
          Recomendado
        </span>

        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wide text-mint">
            Premium · Perfil ampliado
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-white">
              {PRECIO_MENSUAL.premium} €
            </span>
            <span className="text-sm text-sage">/ mes + IVA</span>
          </div>
          <p className="text-sm leading-relaxed text-sage">
            Pensado para llenar agenda.
          </p>
        </div>

        <a
          href="mailto:hola@growwly.es?subject=Quiero%20pasar%20a%20Premium"
          className="press block rounded-full bg-orange px-5 py-3 text-center text-sm font-extrabold text-teal-dark shadow-[0_10px_24px_-8px_rgba(255,186,31,0.5)] transition hover:opacity-90"
        >
          Pasar a Premium
        </a>

        <div className="h-px bg-white/15" />

        <div className="flex flex-col gap-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-mint">
            Todo lo de Básico, más
          </p>
          {INCLUYE_PREMIUM.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/20">
                <Check size={12} strokeWidth={3} className="text-mint" aria-hidden />
              </span>
              <span className="text-sm leading-snug text-white">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
