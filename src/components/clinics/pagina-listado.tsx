import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FondoTextura } from "@/components/fondo-textura";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/breadcrumbs";
import { VistaToggle } from "@/components/clinics/vista-lista-mapa";

export type GrupoEnlaces = { titulo: string; enlaces: { href: string; texto: string }[] };

/** «Título: enlace enlace enlace», como «Explora por ciudad» de /centros. */
export function EnlacesEnLinea({ titulo, enlaces }: GrupoEnlaces) {
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
      <span>{titulo}:</span>
      {enlaces.map((e) => (
        <Link key={e.href} href={e.href} className="text-cyan hover:text-cyan-dark">
          {e.texto}
        </Link>
      ))}
    </p>
  );
}

/**
 * Esqueleto común de los listados de centros por lugar (provincia,
 * ciudad, tratamiento en un lugar), con el mismo aspecto que /centros:
 * fondo de textura, título grande y los resultados en un panel blanco.
 *
 * - `cabecera`: a la izquierda del selector Lista/Mapa (p. ej. «Explora
 *   por ciudad»).
 * - `relacionados`: enlaces a otras páginas (tratamientos en este
 *   lugar…), al final del panel para no tapar los resultados.
 */
export function PaginaListado({
  migas,
  titulo,
  intro,
  cabecera,
  conResultados,
  relacionados,
  resumen,
  children,
}: {
  migas: BreadcrumbItem[];
  titulo: ReactNode;
  intro: ReactNode;
  cabecera?: ReactNode;
  /** Si hay centros: muestra el selector Lista/Mapa y el enlace a «Cómo ordenamos». */
  conResultados: boolean;
  relacionados?: GrupoEnlaces[];
  /** Bloque de datos del lugar (DatosZona), entre los resultados y los enlaces. */
  resumen?: ReactNode;
  children: ReactNode;
}) {
  const grupos = (relacionados ?? []).filter((g) => g.enlaces.length > 0);

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-8">
        <Breadcrumbs items={migas} />
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{titulo}</h1>
        <div className="mt-3 max-w-2xl text-ink-soft">{intro}</div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            {(cabecera || conResultados) && (
              <div className="mb-6 flex flex-col-reverse gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                {cabecera ?? <span className="hidden sm:block" />}
                {conResultados && <VistaToggle />}
              </div>
            )}

            {children}

            {conResultados && (
              <p className="mt-6 text-xs text-ink-soft">
                <Link href="/como-ordenamos" className="underline hover:text-teal-dark">
                  Cómo ordenamos los centros
                </Link>
              </p>
            )}

            {resumen}

            {grupos.length > 0 && (
              <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6">
                {grupos.map((g) => (
                  <EnlacesEnLinea key={g.titulo} {...g} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

/** Lo que se ve cuando no hay centros en el lugar. */
export function SinCentros() {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-paper-dim/50 py-16 text-center">
      <p className="font-display text-xl text-teal-dark">Todavía no hay centros aquí</p>
      <Link
        href="/centros"
        className="mt-4 inline-block rounded-full bg-yellow px-6 py-3 font-display text-sm font-bold text-teal-dark shadow-lg shadow-yellow/30 hover:opacity-90"
      >
        Ver todos los centros
      </Link>
    </div>
  );
}
