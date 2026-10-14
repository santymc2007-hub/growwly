import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Check, X } from "lucide-react";
// Caveat solo se usa en esta página (acento manuscrito puntual) — igual
// que en el resto del sitio, cargarla desde el layout raíz la mandaría
// a todo el sitio.
import "@fontsource/caveat/700.css";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Planes y precios para centros",
  description:
    "Publica tu centro gratis en el directorio de Growwly, o pasa a Premium para que te enviemos pacientes reales cada mes con un mínimo garantizado.",
  alternates: { canonical: "/precios" },
};

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
  "Reparto automático de pacientes, con mínimo garantizado",
  "Ficha completa: descripción, servicios, vídeo y fotos antes/después",
  "Equipo médico, certificados, redes sociales y reserva online",
  "Estadísticas de leads, tasa de elección y estado de cada paciente",
  'Insignia de "perfil detallado" visible en el listado',
];

export default function PreciosPage() {
  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <Breadcrumbs items={[{ label: "Precios", href: "/precios" }]} />
      </div>

      <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-3 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Cabecera */}
          <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-paper-dim to-white px-6 py-14 text-center sm:px-10 sm:py-16">
            <span className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-teal-dark">
              Planes para centros
            </span>
            <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight text-teal-dark sm:text-5xl">
              Más visible, más pacientes
            </h1>
            <p className="max-w-xl text-base text-ink-soft sm:text-lg">
              Tu centro ya aparece en el directorio con el plan Básico. Pasa
              a Premium para que te enviemos pacientes reales que buscan tu
              tratamiento, con un mínimo garantizado cada mes.
            </p>
            <span className="mt-1 inline-flex items-center gap-2 rounded-lg border border-orange/40 bg-orange/10 px-3.5 py-2 text-sm text-[#8a5a00]">
              <AlertTriangle size={16} className="shrink-0" aria-hidden />
              Precios de ejemplo — pendientes de confirmar antes de publicar
            </span>
          </div>

          {/* Tarjetas */}
          <div className="px-6 pb-2 sm:px-10">
            <div className="mx-auto -mt-8 flex max-w-4xl flex-wrap items-stretch justify-center gap-7">
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
                    Para que te encuentren en el directorio desde el primer
                    día. Sin coste, sin compromiso.
                  </p>
                </div>

                <Link
                  href="/clinica/registro"
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
                      XX €
                    </span>
                    <span className="text-sm text-sage">/ mes</span>
                  </div>
                  <p className="text-sm leading-relaxed text-sage">
                    Pensado para llenar agenda: mínimo de 2 pacientes nuevos
                    garantizados cada mes, o seguimos trabajando tu ficha
                    hasta conseguirlo.
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
          </div>

          {/* Nota visibilidad */}
          <div className="px-6 pt-10 sm:px-10">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line px-6 py-6">
              <div className="flex max-w-md flex-col gap-1">
                <p className="font-display text-base font-bold text-teal-dark">
                  ¿Y los extras de Visibilidad?
                </p>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Destacado en el listado, en la Home o en tu ciudad se
                  activan aparte, por el tiempo que elijas, y están
                  disponibles tanto en Básico como en Premium.
                </p>
              </div>
              <Link
                href="/clinica/login"
                className="shrink-0 text-sm font-bold text-teal hover:text-cyan-dark"
              >
                Ver extras de Visibilidad →
              </Link>
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-14 flex flex-col items-center gap-3.5 bg-paper-dim px-6 py-12 text-center sm:px-10">
            <p className="font-hand -rotate-2 text-3xl font-bold text-sage-ink">
              ¿Dudas sobre qué plan te conviene?
            </p>
            <p className="max-w-md text-sm text-ink-soft">
              Escríbenos y te ayudamos a elegir según tu zona y el tipo de
              tratamientos que ofreces.
            </p>
            <a
              href="mailto:hola@growwly.es?subject=Dudas%20sobre%20planes%20Growwly"
              className="press mt-1 inline-block rounded-full bg-teal-dark px-7 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Hablar con el equipo de Growwly
            </a>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
