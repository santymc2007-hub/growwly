import Link from "next/link";
import type { Metadata } from "next";
import { Scissors } from "lucide-react";
// Caveat solo se usa en esta página (acento manuscrito puntual) — igual
// que en el 404 global, cargarla desde el layout raíz la mandaría a todo el sitio.
import "@fontsource/caveat/700.css";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

export const metadata: Metadata = {
  title: "Centro no encontrado",
  robots: { index: false, follow: false },
};

export default async function ClinicaNotFound() {
  const supabase = await createClient();

  const [{ data: centros }, { data: tratamientos }] = await Promise.all([
    supabase
      .from("clinics")
      .select("tipo_negocio, provincia, ciudad")
      .eq("publicado", true)
      .eq("verificado_admin", true),
    supabase
      .from("tratamientos")
      .select("slug, nombre, categoria")
      .eq("publicado", true)
      .order("nombre", { ascending: true }),
  ]);

  const listaCentros = centros ?? [];
  const listaTratamientos = tratamientos ?? [];

  // Solo enlazamos a filtros/ubicaciones que realmente tienen centros hoy
  // — un listado de enlaces a resultados vacíos no ayuda a nadie ni a SEO.
  const porTipo = new Map<string, number>();
  const porCiudad = new Map<string, { provincia: string; ciudad: string; total: number }>();
  for (const c of listaCentros) {
    if (c.tipo_negocio) {
      porTipo.set(c.tipo_negocio, (porTipo.get(c.tipo_negocio) ?? 0) + 1);
    }
    if (c.provincia && c.ciudad) {
      const clave = `${c.provincia}|${c.ciudad}`;
      const actual = porCiudad.get(clave);
      if (actual) {
        actual.total += 1;
      } else {
        porCiudad.set(clave, { provincia: c.provincia, ciudad: c.ciudad, total: 1 });
      }
    }
  }
  const tipos = Array.from(porTipo.entries()).sort((a, b) => b[1] - a[1]);
  const ciudades = Array.from(porCiudad.values()).sort((a, b) => b.total - a.total);

  const tratamientosPorCategoria = CATEGORIAS_TRATAMIENTO.map((categoria) => ({
    categoria,
    items: listaTratamientos.filter((t) => t.categoria === categoria),
  })).filter((grupo) => grupo.items.length > 0);

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-3 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col items-center px-6 py-16 text-center sm:px-10 sm:py-20">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage text-sage-ink">
              <Scissors className="h-8 w-8" aria-hidden />
            </span>

            <p className="font-hand mt-6 text-3xl text-teal-dark sm:text-4xl">
              Te has quedado a un pelo de encontrarlo
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold text-teal-dark sm:text-7xl">
              404
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
              Puede que el enlace esté roto o que este centro ya no forme
              parte del directorio. Vuelve al inicio o echa un vistazo a lo
              que sí tenemos por aquí abajo.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="press inline-block rounded-full bg-yellow px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
              >
                Volver al inicio
              </Link>
              <Link
                href="/centros"
                className="press inline-block rounded-full border border-line bg-white px-6 py-3 font-display text-base font-bold text-teal-dark transition hover:border-teal/40"
              >
                Ver todos los centros
              </Link>
            </div>
          </div>

          <div className="border-t border-line px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="font-display text-xl text-teal-dark">
              Quizá te interese
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {tipos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Centros por tipo
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {tipos.map(([tipo, total]) => (
                      <li key={tipo}>
                        <Link
                          href={`/centros?tipo=${encodeURIComponent(tipo)}`}
                          className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                        >
                          {tipo}{" "}
                          <span className="text-ink-soft">({total})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ciudades.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Centros por ciudad
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {ciudades.map(({ provincia, ciudad, total }) => (
                      <li key={`${provincia}-${ciudad}`}>
                        <Link
                          href={`/centros?provincia=${encodeURIComponent(provincia)}&ciudad=${encodeURIComponent(ciudad)}`}
                          className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                        >
                          {ciudad}{" "}
                          <span className="text-ink-soft">({total})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tratamientosPorCategoria.map(({ categoria, items }) => (
                <div key={categoria}>
                  <h3 className="text-sm font-semibold text-ink">
                    {categoria}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {items.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/tratamientos/${t.slug}`}
                          className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                        >
                          {t.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h3 className="text-sm font-semibold text-ink">Más</h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href="/tratamientos"
                      className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                    >
                      Todos los tratamientos
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                    >
                      Blog capilar
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/analisis/nuevo"
                      className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                    >
                      Hazte un análisis gratuito
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
