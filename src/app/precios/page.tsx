import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
// Caveat solo se usa en esta página (acento manuscrito puntual) — igual
// que en el resto del sitio, cargarla desde el layout raíz la mandaría
// a todo el sitio.
import "@fontsource/caveat/700.css";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TarjetasPlanes } from "@/components/precios/tarjetas-planes";
import { PRECIO_MENSUAL } from "@/lib/visibilidad/tipos";

export const metadata: Metadata = {
  title: "Planes y precios para centros",
  description:
    "Publica tu centro gratis en el directorio de Growwly, o pasa a Premium para que te enviemos pacientes reales cada mes con un mínimo garantizado.",
  alternates: { canonical: "/precios" },
};

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
          <div className="-mt-8 px-6 pb-2 sm:px-10">
            <TarjetasPlanes hrefBasico="/clinica/registro" />
          </div>

          {/* Nota visibilidad */}
          <div className="px-6 pt-10 sm:px-10">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line px-6 py-6">
              <div className="flex max-w-md flex-col gap-1">
                <p className="font-display text-base font-bold text-teal-dark">
                  ¿Y los extras de Visibilidad?
                </p>
                <p className="text-sm leading-relaxed text-ink-soft">
                  <strong className="text-ink">Destacado general</strong>{" "}
                  (portada y listado, 8 plazas en toda España):{" "}
                  {PRECIO_MENSUAL.destacado} €/mes.{" "}
                  <strong className="text-ink">Destacado de provincia</strong>{" "}
                  (8 plazas por provincia): {PRECIO_MENSUAL.destacado_provincia} €/mes.
                  Se activan aparte, por el tiempo que elijas, y están
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
